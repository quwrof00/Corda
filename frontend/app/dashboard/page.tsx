"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { useTeams } from "@/hooks/useTeams";
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Users,
  X,
  Flag,
  Play,
  Pause,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import CreateTaskModal from "@/components/CreateTaskModal";

interface Team {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  team?: Team;
  assignedTo?: { id: string };
  dueDate?: string;
  desc?: string;
  description?: string;
  requiredSkill?: string;
}

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { data: tasks, isLoading: tasksLoading, refetch: refreshTasks } = useTasks();
  const { data: teams, isLoading: teamsLoading } = useTeams();
  const [activeFilter, setActiveFilter] = useState<"Today" | "This Week" | "Overdue">("Today");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const updateTaskMutation = useUpdateTask();

  const handleStatusUpdate = async (status: string) => {
    if (!selectedTask) return;
    try {
      await updateTaskMutation.mutateAsync({
        id: selectedTask.id,
        status: status
      });
      // Close drawer after completion if 'completed'
      if (status === 'completed') setSelectedTask(null);
      refreshTasks();
    } catch (e) {
      console.error("Failed to update task", e);
    }
  };

  // Filter Tasks Logic (Mocked logic for dates as existing data might not have dates)
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    const safeTasks = tasks as Task[];
    // Just returning slice for demo purposes as real date logic depends on backend data shape
    // In a real app, check task.dueDate vs new Date()
    if (activeFilter === "Overdue") return safeTasks.filter((t) => t.status !== "completed").slice(0, 3);
    return safeTasks.filter((t) => t.status !== "completed");
  }, [tasks, activeFilter]);

  const stats = useMemo(() => {
    const deadlinesToday = 2; // Mocked
    return { deadlinesToday };
  }, []);

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
              Good morning, {session.user?.name?.split(" ")[0]}
            </h1>
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              <p>You have <span className="text-zinc-300 font-bold">{stats.deadlinesToday} deadlines</span> approaching.</p>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-xl border border-zinc-900">
            {(["Today", "This Week", "Overdue"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                  activeFilter === filter
                    ? "bg-card text-white shadow-sm border border-zinc-800"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
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

            <div className="space-y-3">
              {activeFilter === "Overdue" ? (filteredTasks as Task[])?.length > 0 &&
                (filteredTasks as Task[]).map((task) => (
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
                        Today
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
                ))
                : (filteredTasks as Task[])?.length > 0 && (filteredTasks as Task[]).map((task) => (
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
                        Today
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
              {filteredTasks.length === 0 && (
                <div className="text-center py-12 bg-card/50 rounded-xl border border-dashed border-zinc-900">
                  <p className="text-zinc-600 text-sm">No tasks for {activeFilter.toLowerCase()}.</p>
                  <button onClick={() => setIsCreateModalOpen(true)} className="mt-4 text-white text-xs font-bold hover:underline uppercase tracking-wide">Create a task</button>
                </div>
              )}
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

            <div className="grid gap-4">
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
                      {/* Alert mock */}
                      {Math.random() > 0.7 && (
                        <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                      )}
                    </div>

                    {/* Workload Bar Mock */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500">
                        <span>Workload</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden relative group/bar">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: "75%" }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center gap-2 text-xs text-amber-500/80 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      3 unassigned
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

        {/* Bottom: Recently Updated (Activity Feed) */}
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
        </div>
      </div>

      {/* Task Detail Drawer */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={() => setSelectedTask(null)}>
          <div
            className="w-full max-w-md bg-card h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-900">
              <h2 className="text-xl font-bold text-white">Task Details</h2>
              <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn("px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border",
                    selectedTask.priority === 'High' ? "bg-red-950/20 text-red-400 border-red-900/50" :
                      selectedTask.priority === 'Medium' ? "bg-amber-950/20 text-amber-400 border-amber-900/50" :
                        "bg-green-950/20 text-green-400 border-green-900/50"
                  )}>
                    {selectedTask.priority} Priority
                  </span>
                  <span className={cn("px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border",
                    selectedTask.status === 'active' || selectedTask.status === 'in-progress' ? "bg-blue-950/20 text-blue-400 border-blue-900/50" : "bg-zinc-900 text-zinc-500 border-zinc-800"
                  )}>
                    {selectedTask.status}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white leading-tight">{selectedTask.title}</h3>
              </div>

              <div className="p-5 rounded-xl bg-zinc-900/30 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 flex items-center gap-2"><Users className="w-4 h-4" /> Team</span>
                  <span className="font-medium text-zinc-200">{selectedTask.team?.name || "Team Alpha"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Due Date</span>
                  <span className="font-medium text-zinc-200">Today</span>
                </div>
                {selectedTask.requiredSkill && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 flex items-center gap-2"><Flag className="w-4 h-4" /> Skill</span>
                    <span className="font-medium text-zinc-200">{selectedTask.requiredSkill}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-zinc-400 mb-3 uppercase tracking-wider">Description</h4>
                <div className="text-sm text-zinc-400 leading-relaxed p-4 bg-zinc-900/30 rounded-xl border border-zinc-800">
                  {selectedTask.desc || selectedTask.description || "No description provided for this task."}
                </div>
              </div>

              <div className="pt-6 mt-auto flex gap-3 border-t border-zinc-900">
                {selectedTask.status !== 'in-progress' && selectedTask.status !== 'completed' && (
                  <button
                    onClick={() => handleStatusUpdate('in-progress')}
                    className="flex-1 py-3 bg-zinc-100 text-black font-bold rounded-xl hover:bg-white transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" /> Start Task
                  </button>
                )}
                {selectedTask.status === 'in-progress' && (
                  <button
                    onClick={() => handleStatusUpdate('active')}
                    className="flex-1 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Pause className="w-4 h-4" /> Pause Task
                  </button>
                )}
                <button
                  onClick={() => handleStatusUpdate('completed')}
                  className="px-6 py-3 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold rounded-xl hover:bg-zinc-800 transition-all duration-200"
                >
                  Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={refreshTasks}
      />
    </div>
  );
}
