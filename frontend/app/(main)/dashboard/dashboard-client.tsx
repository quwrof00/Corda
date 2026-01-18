"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTasks, useUpdateTask, Task } from "@/hooks/useTasks";
import { useTeams } from "@/hooks/useTeams";
import {
  Calendar,
  CheckCircle2,
  ArrowRight,
  Users,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import CreateTaskModal from "@/components/CreateTaskModal";
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
  tasks?: { id: string }[];
  _count?: { tasks: number };
}

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function DashboardClient({ initialTasks, initialTeams }: { initialTasks: Task[], initialTeams: Team[] }) {

  const { data: session } = useSession();
  const router = useRouter();
  const { data: tasks, isLoading: tasksLoading, refetch: refreshTasks } = useTasks(undefined, { initialData: initialTasks });
  const { data: teams, isLoading: teamsLoading } = useTeams({ initialData: initialTeams });
  const [activeFilter, setActiveFilter] = useState<"Today" | "This Week" | "Overdue">("Today");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
    // Update every minute to keep it real-time
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter Tasks Logic (Mocked logic for dates as existing data might not have dates)
  // Filter Tasks Logic
  // Group Tasks Logic
  const groupedTasks = useMemo(() => {
    if (!tasks) return { today: [], week: [], overdue: [] };
    const safeTasks = tasks as Task[];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const today: Task[] = [];
    const week: Task[] = [];
    const overdue: Task[] = [];

    safeTasks.forEach((t) => {
      if (t.status === "completed" || !t.deadline) return;
      const taskDate = new Date(t.deadline);

      if (taskDate < startOfToday) {
        overdue.push(t);
      } else if (taskDate >= startOfToday && taskDate < endOfToday) {
        today.push(t);
      } else if (taskDate >= startOfToday && taskDate < endOfWeek) {
        // "This Week" in the separate view usually implies future tasks in the week
        // To avoid duplicates with "Today", we start from endOfToday
        // However, if the user wants "This Week" to mean "Next 7 days", we might include today.
        // Given the vertical layout, disjoint is better.
        if (taskDate >= endOfToday) {
          week.push(t);
        }
      }
    });

    return { today, week, overdue };
  }, [tasks]);

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

  return (
    <div className="min-h-screen bg-background text-zinc-200 selection:bg-zinc-800 p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* Top Section: Greeting & Status */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-zinc-900">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              {greeting}, {session.user?.name?.split(" ")[0]}
            </h1>
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              <p>You have <span className="text-zinc-300 font-bold">{stats.deadlinesToday == 1 ? `1 deadline` : `${stats.deadlinesToday} deadlines`}</span> approaching.</p>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center p-1 bg-zinc-900/50 rounded-lg border border-zinc-900/50">
            {(["Today", "This Week", "Overdue"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => scrollToSection(filter)}
                className={cn(
                  "flex-1 px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
                  activeFilter === filter
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* A. My Tasks (Primary - 2 cols on wide, goes to 1st pos) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
                <CheckCircle2 className="w-5 h-5 text-zinc-400" />
                My Tasks
              </h2>
            </div>

            <div className="space-y-10">
              {/* Render Helper */}
              {(() => {
                const renderTaskList = (taskList: Task[], title: string, id: string, emptyMsg: string) => (
                  <div id={id} className="scroll-mt-24 space-y-4">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest pl-1">{title} <span className="text-zinc-600 ml-2 text-xs">({taskList.length})</span></h3>
                    {taskList.length > 0 ? (
                      <div className="space-y-3">
                        {taskList.map((task) => (
                          <div
                            key={task.id}
                            className="group relative flex items-center gap-4 p-4 rounded-xl bg-card border border-zinc-900 hover:border-zinc-700 transition-all cursor-pointer"
                            onClick={() => setSelectedTask(task)}
                          >
                            {/* Status Indicator Bar */}
                            <div className={cn("absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-colors",
                              task.priority === 'High' ? "bg-red-500" : "bg-zinc-700 group-hover:bg-zinc-500"
                            )} />

                            {/* Content */}
                            <div className="flex-1 ml-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                                  {task.team?.name || "Unassigned"}
                                </span>
                                {task.priority === 'High' && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" title="High Priority" />
                                )}
                              </div>
                              <h3 className="font-medium text-zinc-200 group-hover:text-white transition-colors">
                                {task.title}
                              </h3>
                            </div>

                            {/* Meta */}
                            <div className="flex items-center gap-6 text-sm text-zinc-500">
                              <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/50 border border-transparent group-hover:border-zinc-800 transition-colors text-xs font-medium">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDaysLeft(task.deadline)}
                              </span>
                              <span className={cn(
                                "hidden sm:flex px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border",
                                task.status === "active"
                                  ? "bg-blue-950/20 text-blue-400 border-blue-900/30"
                                  : "bg-zinc-900 text-zinc-500 border-zinc-800"
                              )}>
                                {task.status}
                              </span>
                            </div>

                            <ArrowRight className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 px-4 border border-dashed border-zinc-900 rounded-xl bg-zinc-900/20 text-center">
                        <p className="text-zinc-600 text-xs">{emptyMsg}</p>
                      </div>
                    )}
                  </div>
                );

                return (
                  <div className="h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    {renderTaskList(groupedTasks.today, "Today", "section-today", "No tasks due today.")}
                    {renderTaskList(groupedTasks.week, "This Week", "section-this-week", "No upcoming tasks for this week.")}
                    {renderTaskList(groupedTasks.overdue, "Overdue", "section-overdue", "No overdue tasks. Great job!")}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* B. My Teams (Secondary) */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
                <Users className="w-5 h-5 text-zinc-400" />
                My Teams
              </h2>
            </div>

            <div className="grid gap-4 h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent content-start">
              {teams && teams.length > 0 ? (
                (teams as Team[]).map((team) => (
                  <div
                    key={team.id}
                    onClick={() => router.push(`/teams/${team.id}`)}
                    className="group p-5 rounded-xl bg-card border border-zinc-900 hover:border-zinc-700 cursor-pointer transition-all hover:-translate-y-[1px]"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 font-bold shadow-sm group-hover:bg-zinc-800 transition-colors">
                          {team.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-zinc-200 leading-tight group-hover:text-white transition-colors">{team.name}</h3>
                          <p className="text-xs text-zinc-600 uppercase tracking-wider font-bold">Member</p>
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
                        <span className="text-white font-medium">{team.tasks?.length || 0}</span>
                      </div>
                      <div className="w-px h-6 bg-zinc-800" />
                      <div className="flex flex-col">
                        <span className="text-zinc-500 uppercase text-[10px] font-bold">Unassigned</span>
                        <span className="text-amber-500 font-medium">{team._count?.tasks || 0}</span>
                      </div>
                    </div>


                  </div>
                ))
              ) : (
                <div className="p-6 text-center border border-zinc-900 rounded-xl bg-card/50">
                  <p className="text-sm text-zinc-600">You are not in any teams.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Bottom: Recently Updated (Activity Feed)
        <div className="pt-6 border-t border-zinc-900">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Recently Updated</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-w-[280px] p-4 rounded-xl bg-card border border-zinc-900 hover:border-zinc-700 transition-all cursor-pointer">
                <div className="flex items-center gap-2 mb-2 text-xs text-zinc-500 font-medium">
                  <Clock className="w-3 h-3" />
                  <span>2 hours ago</span>
                </div>
                <p className="font-medium text-zinc-200 text-sm">Updated styling for dashboard</p>
                <p className="text-xs text-zinc-600 mt-1 uppercase tracking-wider font-bold">Moved to In Progress</p>
              </div>
            ))}
          </div>
        </div> */}
      </div>

      {/* Task Detail Drawer */}
      {selectedTask && (
        <TaskDetailDrawer selectedTask={selectedTask} setSelectedTask={setSelectedTask} updateTaskMutation={updateTaskMutation} refreshTasks={refreshTasks} />
      )}

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={refreshTasks}
        currentUserId={session.user?.id}
      />
    </div>
  );
}
