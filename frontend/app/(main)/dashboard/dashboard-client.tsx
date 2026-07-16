"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import MoodleSyncButton from "@/components/tasks/moodle-sync-button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { flattenInfiniteTasks, useInfiniteTasks, useUpdateTask, Task } from "@/hooks/useTasks";
import { flattenInfiniteTeams, useInfiniteTeams } from "@/hooks/useTeams";
import { buildTaskTree, flattenTree } from "@/lib/taskTreeUtils";
import { CheckCircle2, ArrowRight, Users, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import TaskDetailDrawer from "@/components/TaskDetailDrawer";
import { useModalStore } from "@/hooks/useModalStore";
import { EmptyState } from "@/components/shared/EmptyState";
import { TaskListSkeleton, TeamGridSkeleton } from "@/components/shared/SkeletonLoader";
import { TaskItem } from "@/components/tasks/TaskItem";
import { useInfiniteScrollTrigger } from "@/hooks/useInfiniteScrollTrigger";

function formatDaysLeft(dateString?: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();

  // Reset time part for accurate day calculation
  date.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays === 0) return "Due Today";
  if (diffDays === 1) return "1 day left";
  return `${diffDays} days left`;
}

interface Team {
  id: string;
  name: string;
  leader?: { email: string };
  tasks?: { id: string }[];
  _count?: { tasks: number };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Button Component for consistency
const PrimaryButton = ({ children, onClick, className, disabled }: { children: React.ReactNode, onClick: () => void, className?: string, disabled?: boolean }) => (
  <motion.button
    whileHover={disabled ? {} : { scale: 1.02 }}
    whileTap={disabled ? {} : { scale: 0.95 }}
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "flex items-center gap-2 px-4 py-2 bg-[var(--accent-time)] text-[var(--accent-time-text)] text-xs font-bold uppercase tracking-wider rounded-md transition-all shadow-lg shadow-black/5 dark:shadow-white/5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
      className
    )}
  >
    {children}
  </motion.button>
);

export default function DashboardClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  // Calculate localized date ranges for accurate filtering
  const { todayRange, weekRange, currentNow } = useMemo(() => {
    const now = new Date();
    // Start of local today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // End of local today (Start of tomorrow)
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    // This week (Sunday to Sunday or just 7 days from now?)
    // Usually standard in task apps: Sunday to next Sunday
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return {
       todayRange: { start: startOfToday.toISOString(), end: endOfToday.toISOString() },
       weekRange: { start: startOfToday.toISOString(), end: endOfWeek.toISOString() },
       currentNow: now.toISOString(),
    };
  }, []);

  const todayTasksQuery = useInfiniteTasks({ 
    startDate: todayRange.start, 
    endDate: todayRange.end, 
    dateFilter: "overdue", // Ensures only pending tasks are counted/returned
    sortBy: "newest", 
    limit: 6 
  }, { enabled: !!session });

  const weekTasksQuery = useInfiniteTasks({ 
    startDate: weekRange.start, 
    endDate: weekRange.end, 
    dateFilter: "overdue", // Ensures only pending tasks are counted/returned
    sortBy: "newest", 
    limit: 6 
  }, { enabled: !!session });

  const overdueTasksQuery = useInfiniteTasks({ 
    endDate: currentNow, // Due before now
    dateFilter: "overdue", // Triggers the "not completed" logic on server
    sortBy: "newest", 
    limit: 6 
  }, { enabled: !!session });

  const teamsQuery = useInfiniteTeams({ enabled: !!session, limit: 6 });
  const [activeFilter, setActiveFilter] = useState<"Today" | "This Week" | "Overdue">("Today");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { openTaskModal, setPageContext } = useModalStore();

  useEffect(() => {
    setPageContext({ isPersonalWorkspace: true });
    return () => setPageContext({});
  }, [setPageContext]);
  const updateTaskMutation = useUpdateTask();
  const [greeting, setGreeting] = useState("Good morning");
  const dashboardTasksRootRef = useRef<HTMLDivElement | null>(null);
  const dashboardTeamsRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 4 && hour < 12) {
        setGreeting("Good morning");
      } else if (hour >= 12 && hour < 17) {
        setGreeting("Good afternoon");
      } else if (hour >= 17 && hour < 21) {
        setGreeting("Good evening");
      } else {
        setGreeting("Good night");
      }
    };
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);


  const handleQuickComplete = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await updateTaskMutation.mutateAsync({ id: task.id, status: newStatus });
    } catch (err) {
      console.error("Failed to update task", err);
    }
  };

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleToggleExpand = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const todayTasks = useMemo(
    () => flattenInfiniteTasks(todayTasksQuery.data).filter((task) => task.status !== "completed"),
    [todayTasksQuery.data]
  );
  const weekTasks = useMemo(
    () => flattenInfiniteTasks(weekTasksQuery.data).filter((task) => task.status !== "completed"),
    [weekTasksQuery.data]
  );
  const overdueTasks = useMemo(
    () => flattenInfiniteTasks(overdueTasksQuery.data).filter((task) => task.status !== "completed"),
    [overdueTasksQuery.data]
  );
  const teams = useMemo(() => flattenInfiniteTeams(teamsQuery.data), [teamsQuery.data]);

  const groupedTasks = useMemo(() => ({
    today: flattenTree(buildTaskTree(todayTasks), expandedIds),
    week: flattenTree(buildTaskTree(weekTasks), expandedIds),
    overdue: flattenTree(buildTaskTree(overdueTasks), expandedIds),
  }), [todayTasks, weekTasks, overdueTasks, expandedIds]);

  const stats = useMemo(() => ({
    deadlinesToday: todayTasksQuery.data?.pages[0]?.total || 0
  }), [todayTasksQuery.data]);

  const shouldShowTasksSkeleton =
    status === "loading" ||
    (activeFilter === "Today" ? todayTasksQuery.isPending :
     activeFilter === "This Week" ? weekTasksQuery.isPending :
     overdueTasksQuery.isPending);

  const shouldShowTeamsSkeleton = status === "loading" || teamsQuery.isPending;

  const todaySentinelRef = useInfiniteScrollTrigger({
    hasMore: !!todayTasksQuery.hasNextPage,
    isLoading: todayTasksQuery.isFetchingNextPage,
    onLoadMore: () => void todayTasksQuery.fetchNextPage(),
    rootRef: dashboardTasksRootRef,
  });
  const weekSentinelRef = useInfiniteScrollTrigger({
    hasMore: !!weekTasksQuery.hasNextPage,
    isLoading: weekTasksQuery.isFetchingNextPage,
    onLoadMore: () => void weekTasksQuery.fetchNextPage(),
    rootRef: dashboardTasksRootRef,
  });
  const overdueSentinelRef = useInfiniteScrollTrigger({
    hasMore: !!overdueTasksQuery.hasNextPage,
    isLoading: overdueTasksQuery.isFetchingNextPage,
    onLoadMore: () => void overdueTasksQuery.fetchNextPage(),
    rootRef: dashboardTasksRootRef,
  });
  const teamsSentinelRef = useInfiniteScrollTrigger({
    hasMore: !!teamsQuery.hasNextPage,
    isLoading: teamsQuery.isFetchingNextPage,
    onLoadMore: () => void teamsQuery.fetchNextPage(),
    rootRef: dashboardTeamsRootRef,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (!session && status !== "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white"></div>
          <p className="text-sm text-zinc-500 animate-pulse">Session expired. Redirecting...</p>
        </div>
      </div>
    );
  }

  const renderTaskList = (
    taskList: (Task & { level: number })[],
    title: string,
    id: string,
    emptyMsg: string,
    totalCount?: number,
    hasMore?: boolean,
    sentinelRef?: React.RefObject<HTMLDivElement | null>
  ) => (
    <motion.div id={id} className="scroll-mt-24 space-y-4" variants={itemVariants}>
      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest pl-1">{title} <span className="text-zinc-600 ml-2 text-xs">({totalCount ?? taskList.length})</span></h3>
        {taskList.length > 0 ? (
          <div key={`list-${id}`} className="space-y-3">
            {taskList.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onSelect={setSelectedTask}
                onQuickComplete={handleQuickComplete}
                onToggleExpand={handleToggleExpand}
                onAddSubtask={(taskId, teamId, e) => {
                  e.stopPropagation();
                  openTaskModal({ parentId: taskId, teamId: teamId });
                }}
                isExpanded={expandedIds.has(task.id)}
                variant="dashboard"
                showTeamBadge={true}
                showStatus={true}
                showDeadline={true}
                formatDaysLeft={formatDaysLeft}
              />
            ))}
            {hasMore && sentinelRef ? <div ref={sentinelRef} className="h-4 w-full" /> : null}
          </div>
        ) : (
          <div key={`empty-${id}`}>
            <EmptyState
              icon={CheckCircle2}
              title=""
              description={emptyMsg}
              actionLabel="Create Task"
              onAction={() => openTaskModal()}
              variant="minimal"
            />
          </div>
        )}
    </motion.div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-background text-zinc-900 dark:text-zinc-200 selection:bg-zinc-200 dark:selection:bg-zinc-800 p-6 md:p-12"
    >
      <div className="max-w-7xl mx-auto space-y-12">

        {/* Top Section: Greeting & Status */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[var(--border-time)]">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
              {greeting}, {session?.user?.name?.split(" ")[0] || "there"}
            </h1>
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-500 text-sm">
              <span className="flex h-2 w-2 rounded-full bg-[var(--success-time)] shadow-[0_0_8px_var(--success-glow)] transition-all"></span>
              <p>You have <span className="text-zinc-900 dark:text-zinc-300 font-bold">{stats.deadlinesToday === 1 ? `1 deadline` : `${stats.deadlinesToday} deadlines`}</span> approaching.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <MoodleSyncButton variant="button" />
            {/* Main Action - HCI: Fitts's Law / Visibility */}
            <PrimaryButton onClick={() => openTaskModal()}>
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>New Task</span>
                <div className="hidden md:flex items-center gap-0.5 ml-1 px-1.5 py-0.5 bg-zinc-200/50 rounded text-[9px] text-zinc-600 font-mono">
                  <span>C</span>
                </div>
              </div>
            </PrimaryButton>

            <div className="hidden sm:block w-px h-8 bg-[var(--border-time)]"></div>

            <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-900/50 rounded-lg border border-[var(--border-time)]">
              {(["Today", "This Week", "Overdue"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    "relative flex-1 px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all z-0",
                    activeFilter === filter
                      ? "text-zinc-900 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/50"
                  )}
                >
                  {activeFilter === filter && (
                    <motion.div
                      layoutId="activeFilter"
                      className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-md shadow-sm border border-zinc-200 dark:border-transparent -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* A. My Tasks (Primary - 2 cols on wide, goes to 1st pos) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 tracking-tight">
                <CheckCircle2 className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                My Tasks
              </h2>
              <Link href="/tasks" className="text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 uppercase tracking-wider flex items-center gap-1 transition-colors mr-2">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div ref={dashboardTasksRootRef} className="h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {shouldShowTasksSkeleton ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest pl-1">{activeFilter}</h3>
                  <TaskListSkeleton rows={3} />
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {activeFilter === "Today" && (
                    <motion.div key="today" initial="hidden" animate="visible" exit="hidden" variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 10 } }}>
                      {renderTaskList(todayTasks.length > 0 ? groupedTasks.today : [], "Today", "section-today", "No tasks due today.", todayTasksQuery.data?.pages[0]?.total, todayTasksQuery.hasNextPage, todaySentinelRef)}
                      {todayTasksQuery.isFetchingNextPage && <TaskListSkeleton rows={2} />}
                    </motion.div>
                  )}
                  {activeFilter === "This Week" && (
                    <motion.div key="week" initial="hidden" animate="visible" exit="hidden" variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 10 } }}>
                      {renderTaskList(weekTasks.length > 0 ? groupedTasks.week : [], "This Week", "section-this-week", "No upcoming tasks for this week.", weekTasksQuery.data?.pages[0]?.total, weekTasksQuery.hasNextPage, weekSentinelRef)}
                      {weekTasksQuery.isFetchingNextPage && <TaskListSkeleton rows={2} />}
                    </motion.div>
                  )}
                  {activeFilter === "Overdue" && (
                    <motion.div key="overdue" initial="hidden" animate="visible" exit="hidden" variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 10 } }}>
                      {renderTaskList(overdueTasks.length > 0 ? groupedTasks.overdue : [], "Overdue", "section-overdue", "No overdue tasks. Great job!", overdueTasksQuery.data?.pages[0]?.total, overdueTasksQuery.hasNextPage, overdueSentinelRef)}
                      {overdueTasksQuery.isFetchingNextPage && <TaskListSkeleton rows={2} />}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* B. My Teams (Secondary) */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 tracking-tight">
                <Users className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                My Teams
              </h2>
              <Link href="/teams" className="text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 uppercase tracking-wider flex items-center gap-1 transition-colors mr-2">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div ref={dashboardTeamsRootRef} className="grid gap-4 h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent content-start">
              {shouldShowTeamsSkeleton ? (
                <TeamGridSkeleton count={3} compact />
              ) : teams && teams.length > 0 ? (
                <>
                {teams.map((team) => (
                  <motion.div
                    key={team.id}
                    onClick={() => router.push(`/teams/${team.id}`)}
                    className="relative group p-5 rounded-xl bg-card border border-[var(--border-time)] hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer transition-all hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-[var(--border-time)] flex items-center justify-center text-zinc-700 dark:text-zinc-300 font-bold shadow-sm group-hover:bg-zinc-200 dark:group-hover:bg-zinc-800 transition-colors">
                          {team.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-zinc-800 dark:text-zinc-200 leading-tight group-hover:text-black dark:group-hover:text-white transition-colors">{team.name}</h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-600 uppercase tracking-wider font-bold">Member</p>
                        </div>
                      </div>
                      {/* Alert for unassigned tasks */}
                      {(team._count?.tasks || 0) > 0 && (
                        <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" title={`${team._count?.tasks} unassigned tasks`}></div>
                      )}
                    </div>

                    {/* Task Stats - Text Only */}
                    <div className="flex items-center gap-4 text-xs font-mono mt-2">
                      <div className="flex flex-col">
                        <span className="text-zinc-500 uppercase text-[10px] font-bold">Total</span>
                        <span className="text-zinc-900 dark:text-white font-medium">{team.tasks?.length || 0}</span>
                      </div>
                      <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />
                      <div className="flex flex-col">
                        <span className="text-zinc-500 uppercase text-[10px] font-bold">Unassigned</span>
                        <span className="text-amber-500 font-medium">{team._count?.tasks || 0}</span>
                      </div>
                    </div>


                  </motion.div>
                ))}
                {teamsQuery.hasNextPage && <div ref={teamsSentinelRef} className="h-4 w-full" />}
                {teamsQuery.isFetchingNextPage && <TeamGridSkeleton count={2} compact />}
                </>
              ) : (
                <div className="p-6 text-center border border-zinc-200 dark:border-zinc-900 rounded-xl bg-card/50">
                  <p className="text-sm text-zinc-500 dark:text-zinc-600">You are not in any teams.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Task Detail Drawer */}
      {
        selectedTask && !shouldShowTasksSkeleton && (
          <TaskDetailDrawer
            selectedTask={selectedTask}
            setSelectedTask={setSelectedTask}
            updateTaskMutation={updateTaskMutation}
            refreshTasks={() => {
              void todayTasksQuery.refetch();
              void weekTasksQuery.refetch();
              void overdueTasksQuery.refetch();
            }}
            isLeader={
              // User can delete if:
              // 1. Task is from Personal workspace (team name is "Personal")
              // 2. User is the leader of the task's team
              selectedTask.team?.name === 'Personal' ||
              (teams || []).some(team =>
                team.id === selectedTask.teamId &&
                (team as Team).leader?.email === session?.user?.email
              )
            }
            currentUserId={session?.user?.id}
            onCreateSubtask={(parentId, teamId) => {
              openTaskModal({
                assignedToId: session?.user?.id,
                parentId: parentId,
                teamId: teamId,
                isPersonalWorkspace: selectedTask.team?.name === 'Personal',
              });
            }}
          />
        )
      }

    </motion.div>
  );
}
