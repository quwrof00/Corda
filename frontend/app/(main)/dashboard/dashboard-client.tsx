"use client";

import { useState, useMemo, useEffect } from "react";
import MoodleSyncButton from "@/components/tasks/moodle-sync-button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTasks, useUpdateTask, Task } from "@/hooks/useTasks";
import { useTeams } from "@/hooks/useTeams";
import { buildTaskTree, flattenTree } from "@/lib/taskTreeUtils";
import {
  Calendar,
  CheckCircle2,
  ArrowRight,
  Users,
  Plus,
  Check,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence } from "framer-motion";

import CreateTaskModal from "@/components/CreateTaskModal";
import CreateTeamModal from "@/components/CreateTeamModal";
import TaskDetailDrawer from "@/components/TaskDetailDrawer";

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

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
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
const PrimaryButton = ({ children, onClick, className }: { children: React.ReactNode, onClick: () => void, className?: string }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-wider rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-lg shadow-black/5 dark:shadow-white/5",
      className
    )}
  >
    {children}
  </motion.button>
);

export default function DashboardClient({ initialTasks, initialTeams }: { initialTasks: Task[], initialTeams: Team[] }) {

  const { data: session } = useSession();
  const router = useRouter();
  const { data: tasks, isLoading: tasksLoading, refetch: refreshTasks } = useTasks(undefined, { initialData: initialTasks });
  const { data: teams, isLoading: teamsLoading } = useTeams({ initialData: initialTeams });
  const [activeFilter, setActiveFilter] = useState<"Today" | "This Week" | "Overdue">("Today");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [parentTaskId, setParentTaskId] = useState<string | undefined>(undefined);
  const [parentTeamId, setParentTeamId] = useState<string | undefined>(undefined);
  const updateTaskMutation = useUpdateTask();
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const updateGreeting = () => {
      // Get current hour in IST (Indian Standard Time)
      // Using en-US with Asia/Kolkata timezone to get the hour in 0-23 format
      const istDate = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        hour12: false
      });

      const hour = parseInt(istDate, 10);

      // 4 am - 12 pm - morning
      // 12 pm - 5 pm - afternoon
      // 5 pm - 9 pm - evening
      // 9 pm - 4 am - night

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
    updateGreeting();
    // Update every minute to keep it real-time
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  // HCI: Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 'C' to create TASK
      // 'N' to create TEAM
      const isInput = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
      if (isInput || e.ctrlKey || e.metaKey) return;

      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setIsCreateModalOpen(true);
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsCreateTeamModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  const groupedTasks = useMemo(() => {
    if (!tasks) return { today: [], week: [], overdue: [] };
    const safeTasks = tasks as Task[];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    // Helpers for filtering
    const isOverdue = (t: Task): boolean => !!(t.deadline && new Date(t.deadline) < startOfToday && t.status !== 'completed');
    const isToday = (t: Task): boolean => !!(t.deadline && new Date(t.deadline) >= startOfToday && new Date(t.deadline) < endOfToday && t.status !== 'completed');
    const isWeek = (t: Task): boolean => !!(t.deadline && new Date(t.deadline) >= endOfToday && new Date(t.deadline) < endOfWeek && t.status !== 'completed');

    // Build full tree first
    const fullTree = buildTaskTree(safeTasks);

    // Filter tree while preserving ALL children of matching parents
    const filterTree = (nodes: Task[], predicate: (t: Task) => boolean): Task[] => {
      const result: Task[] = [];

      for (const node of nodes) {
        const nodeMatches = predicate(node);

        // Recursively check if any descendant matches
        const hasMatchingDescendant = (task: Task): boolean => {
          if (predicate(task)) return true;
          if (task.children && task.children.length > 0) {
            return task.children.some(child => hasMatchingDescendant(child));
          }
          return false;
        };

        const descendantMatches = node.children && node.children.length > 0
          ? node.children.some(child => hasMatchingDescendant(child))
          : false;

        // Include node if it matches OR if any descendant matches
        if (nodeMatches || descendantMatches) {
          // If this node matches, keep ALL its children (don't filter them)
          // If only descendants match, recursively filter to find the matching branch
          const childrenToInclude = nodeMatches
            ? (node.children || [])  // Keep all children if parent matches
            : filterTree(node.children || [], predicate);  // Filter children if only descendants match

          result.push({
            ...node,
            children: childrenToInclude
          });
        }
      }

      return result;
    };

    // Filter trees for each category
    const overdueTree = filterTree(fullTree, isOverdue);
    const todayTree = filterTree(fullTree, isToday);
    const weekTree = filterTree(fullTree, isWeek);

    // Flatten trees respecting expanded state using shared utility
    return {
      overdue: flattenTree(overdueTree, expandedIds),
      today: flattenTree(todayTree, expandedIds),
      week: flattenTree(weekTree, expandedIds)
    };
  }, [tasks, expandedIds]);

  const scrollToSection = (section: "Today" | "This Week" | "Overdue") => {
    setActiveFilter(section);
    const element = document.getElementById(`section-${section.toLowerCase().replace(" ", "-")}`);
    if (element) {
      const offset = 100; // Offset for sticky headers or breathing room
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const [stats, setStats] = useState({ deadlinesToday: 0 });

  useEffect(() => {
    if (!tasks) return;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const count = (tasks as Task[]).filter((t) => {
      if (t.status === "completed" || !t.deadline) return false;
      const d = new Date(t.deadline);
      return d >= startOfToday && d < endOfToday;
    }).length;

    setStats({ deadlinesToday: count });
  }, [tasks]);

  if (tasksLoading || teamsLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4 text-zinc-500 text-sm">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
          <span>Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const renderTaskList = (taskList: (Task & { level: number })[], title: string, id: string, emptyMsg: string) => (
    <motion.div id={id} className="scroll-mt-24 space-y-4" variants={itemVariants}>
      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest pl-1">{title} <span className="text-zinc-600 ml-2 text-xs">({taskList.length})</span></h3>
      <AnimatePresence mode="popLayout">
        {taskList.length > 0 ? (
          <div className="space-y-3">
            {taskList.map((task) => {
              const hasChildren = task.children && task.children.length > 0;
              const isExpanded = expandedIds.has(task.id);

              return (
                <motion.div
                  layout
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  key={task.id}
                  className={cn(
                    "group relative flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50",
                    task.source === 'moodle'
                      ? "bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-950/30 dark:to-transparent border-orange-200/80 dark:border-orange-800/50 hover:from-orange-100/50 dark:hover:from-orange-900/50"
                      : "bg-card border-zinc-200 dark:border-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/30",
                    task.level > 0 && "border-l-4 border-l-zinc-300 dark:border-l-zinc-800",
                    task.status === 'completed' && "opacity-60"
                  )}
                  style={{ marginLeft: task.level > 0 ? `${task.level * 1.5}rem` : 0 }}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTask(task)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedTask(task);
                  }}
                >
                  {/* Status Indicator Bar */}
                  <div className={cn("absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-colors",
                    task.status === 'completed' ? "bg-emerald-500" :
                      task.priority === 'High' ? "bg-red-500" : "bg-zinc-700 group-hover:bg-zinc-500"
                  )} />

                  {/* Completion Indicator or Quick Complete Action */}
                  {task.status === 'completed' ? (
                    <button
                      className="ml-3 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center z-10 hover:bg-emerald-600 transition-colors cursor-pointer"
                      onClick={(e) => handleQuickComplete(e, task)}
                      title="Mark as Incomplete"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </button>
                  ) : (
                    <button
                      className="ml-3 h-5 w-5 rounded-full border-2 border-zinc-700 flex items-center justify-center text-zinc-400 hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all z-10 cursor-pointer"
                      onClick={(e) => handleQuickComplete(e, task)}
                      title="Mark as Completed"
                    >
                    </button>
                  )}

                  {/* Chevron between checkbox and title */}
                  {hasChildren && (
                    <button
                      onClick={(e) => handleToggleExpand(task.id, e)}
                      className="flex-shrink-0 p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
                      title={isExpanded ? "Collapse" : "Expand"}
                    >
                      <ChevronRight className={cn("w-3.5 h-3.5 text-zinc-500 transition-transform duration-200", isExpanded && "rotate-90")} />
                    </button>
                  )}

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800">
                        {task.team?.name || "Unassigned"}
                      </span>
                      {task.priority === 'High' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" title="High Priority" />
                      )}
                    </div>
                    <h3 className={cn(
                      "font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white transition-colors",
                      task.status === 'completed' && "line-through text-zinc-500"
                    )}>
                      {task.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-zinc-500">
                    <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900/50 border border-transparent group-hover:border-zinc-200 dark:group-hover:border-zinc-800 transition-colors text-xs font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDaysLeft(task.deadline)}
                    </span>
                    <span className={cn(
                      "hidden sm:flex px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border",
                      task.status === "active" || task.status === "in-progress"
                        ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30"
                        : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800"
                    )}>
                      {task.status === 'pending' || task.status === 'to-do' ? 'To Do' :
                        task.status === 'active' || task.status === 'in-progress' ? 'In Progress' :
                          task.status.replace('-', ' ')}
                    </span>
                  </div>

                  {/* Add Subtask Button - Shows on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setParentTaskId(task.id);
                      setParentTeamId(task.teamId);
                      setIsCreateModalOpen(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md"
                    title="Add Subtask"
                  >
                    <Plus className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  </button>

                  <ArrowRight className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </motion.div>
              )
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-8 px-4 border border-dashed border-zinc-300 dark:border-zinc-900 rounded-xl bg-zinc-50 dark:bg-zinc-900/20 text-center flex flex-col items-center justify-center gap-2 group hover:border-zinc-400 dark:hover:border-zinc-800 transition-colors"
          >
            <p className="text-zinc-500 dark:text-zinc-600 text-xs">{emptyMsg}</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors px-3 py-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
              <Plus className="w-3 h-3" />
              Create Task
            </button>
          </motion.div>
        )}
      </AnimatePresence>
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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-zinc-200 dark:border-zinc-900">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
              {greeting}, {session.user?.name?.split(" ")[0]}
            </h1>
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-500 text-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              <p>You have <span className="text-zinc-900 dark:text-zinc-300 font-bold">{stats.deadlinesToday == 1 ? `1 deadline` : `${stats.deadlinesToday} deadlines`}</span> approaching.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <MoodleSyncButton variant="button" />
            {/* Main Action - HCI: Fitts's Law / Visibility */}
            <PrimaryButton onClick={() => setIsCreateModalOpen(true)}>
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>New Task</span>
                <div className="hidden md:flex items-center gap-0.5 ml-1 px-1.5 py-0.5 bg-zinc-200/50 rounded text-[9px] text-zinc-600 font-mono">
                  <span>C</span>
                </div>
              </div>
            </PrimaryButton>

            {/* Vertical Divider */}
            <div className="hidden sm:block w-px h-8 bg-zinc-200 dark:bg-zinc-800"></div>

            {/* Quick Filters */}
            <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-900/50">
              {(["Today", "This Week", "Overdue"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => scrollToSection(filter)}
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

            <div className="h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {renderTaskList(groupedTasks.today, "Today", "section-today", "No tasks due today.")}
              {renderTaskList(groupedTasks.week, "This Week", "section-this-week", "No upcoming tasks for this week.")}
              {renderTaskList(groupedTasks.overdue, "Overdue", "section-overdue", "No overdue tasks. Great job!")}
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

            <div className="grid gap-4 h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent content-start">
              {teams && teams.length > 0 ? (
                (teams as Team[]).map((team) => (
                  <motion.div
                    key={team.id}
                    onClick={() => router.push(`/teams/${team.id}`)}
                    className="relative group p-5 rounded-xl bg-card border border-zinc-200 dark:border-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer transition-all hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 font-bold shadow-sm group-hover:bg-zinc-200 dark:group-hover:bg-zinc-800 transition-colors">
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
                ))
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
        selectedTask && (
          <TaskDetailDrawer
            selectedTask={selectedTask}
            setSelectedTask={setSelectedTask}
            updateTaskMutation={updateTaskMutation}
            refreshTasks={refreshTasks}
            isLeader={
              // User can delete if:
              // 1. Task is from Personal workspace (team name is "Personal")
              // 2. User is the leader of the task's team
              selectedTask.team?.name === 'Personal' ||
              (teams as Team[] || []).some(team =>
                team.id === selectedTask.teamId &&
                (team as Team).leader?.email === session?.user?.email
              )
            }
            currentUserId={session?.user?.id}
          />
        )
      }

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setParentTaskId(undefined);
          setParentTeamId(undefined);
        }}
        onTaskCreated={refreshTasks}
        currentUserId={session.user?.id}
        initialParentId={parentTaskId}
        initialTeamId={parentTeamId}
      />

      <CreateTeamModal
        isOpen={isCreateTeamModalOpen}
        onClose={() => setIsCreateTeamModalOpen(false)}
      />
    </motion.div>
  );
}

