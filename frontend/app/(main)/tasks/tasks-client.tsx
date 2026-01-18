"use client";
import { Plus, Calendar, AlertCircle, CheckCircle2, Play, Pause, Ban, Flag, RefreshCw } from "lucide-react";
import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import CreateTaskModal from "@/components/CreateTaskModal";
import TaskDetailDrawer from "@/components/TaskDetailDrawer";
import { useTasks, useUpdateTask, Task } from "@/hooks/useTasks";

function cn(...inputs: (string | undefined | null | false)[]) {
    return inputs.filter(Boolean).join(' ');
}

export default function TasksClient({ initialTasks, userId }: { initialTasks: Task[], userId: string }) {
    const { data: session } = useSession();
    const [statusFilter, setStatusFilter] = useState<"All" | "Todo" | "In Progress" | "Blocked" | "Done">("Todo");

    // Use the hook with initialData
    const { data: tasksData, isLoading, refetch } = useTasks(undefined, { initialData: initialTasks });

    // Memoize tasks to prevent dependency changes on every render
    const tasks = useMemo(() => (tasksData as Task[]) || [], [tasksData]);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    // Remove local fetchTasks, use refetch from hook

    // Hook for updates
    const updateTaskMutation = useUpdateTask();

    const handleStatusUpdate = async (taskId: string, newStatus: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            await updateTaskMutation.mutateAsync({ id: taskId, status: newStatus });
        } catch (err) {
            console.error("Failed to update task", err);
        }
    };

    const filteredTasks = useMemo(() => {
        let res = [...tasks];

        if (statusFilter !== "All") {
            res = res.filter((t) => {
                const s = (t.status || "pending").toLowerCase();
                if (statusFilter === "Todo") return s === "pending" || s === "active";
                if (statusFilter === "In Progress") return s === "in-progress";
                if (statusFilter === "Blocked") return s === "blocked";
                if (statusFilter === "Done") return s === "completed";
                return true;
            });
        }

        const priorityScore: Record<string, number> = { "High": 3, "Medium": 2, "Low": 1 };
        res.sort((a, b) => (priorityScore[b.priority] || 0) - (priorityScore[a.priority] || 0));
        return res;
    }, [tasks, statusFilter]);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High': return 'text-red-400 border-red-900/50 bg-red-950/20';
            case 'Medium': return 'text-amber-400 border-amber-900/50 bg-amber-950/20';
            case 'Low': return 'text-zinc-400 border-zinc-800 bg-zinc-900';
            default: return 'text-zinc-400 border-zinc-800 bg-zinc-900';
        }
    };

    if (!session) {
        return <div className="min-h-screen bg-background text-zinc-400 flex items-center justify-center font-sans text-sm">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-background text-zinc-200 selection:bg-zinc-800">
            <div className="max-w-7xl mx-auto px-6 py-12">

                {/* Header & Filters */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white">
                                Tasks
                            </h1>
                            <p className="text-zinc-500 text-sm mt-1">
                                Manage and track your tasks
                            </p>
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="group flex items-center gap-2 px-5 py-2.5 bg-zinc-100 hover:bg-white text-black transition-all duration-200 font-medium text-sm overflow-hidden relative border-none rounded-lg"
                        >
                            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                            <span className="font-bold tracking-wide">New Task</span>
                        </button>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-4">
                        {(["Todo", "In Progress", "Blocked", "Done"] as const).map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setStatusFilter(filter)}
                                className={cn(
                                    "px-4 py-1.5 text-xs font-medium tracking-wide transition-all duration-200 rounded-md",
                                    statusFilter === filter
                                        ? "bg-zinc-800 text-white border border-zinc-700"
                                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 border border-transparent"
                                )}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Task List */}
                <div className="space-y-1">
                    {isLoading && tasks.length === 0 ? (
                        <div className="text-zinc-500 text-sm py-10 flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" /> Loading tasks...
                        </div>
                    ) : filteredTasks.length > 0 ? (
                        filteredTasks.map((task) => (
                            <div
                                key={task.id}
                                className="group relative bg-card border border-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900 transition-all duration-200 p-4 flex items-center gap-4 rounded-lg cursor-pointer"
                                onClick={() => setSelectedTask(task)}
                            >
                                {/* Status Indicator */}
                                <div className={cn(
                                    "w-1 h-12 flex-shrink-0 transition-colors duration-300 rounded-full",
                                    task.status === 'completed' ? "bg-emerald-500" :
                                        task.status === 'in-progress' ? "bg-blue-500" :
                                            task.status === 'blocked' ? "bg-red-500" :
                                                "bg-zinc-700 group-hover:bg-zinc-500"
                                )} />

                                {/* Checkbox/Status Action */}
                                <button
                                    onClick={(e) => handleStatusUpdate(task.id, task.status === 'completed' ? 'active' : 'completed', e)}
                                    className={cn(
                                        "flex-shrink-0 w-6 h-6 border flex items-center justify-center transition-all duration-200 rounded-full",
                                        task.status === 'completed'
                                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-500"
                                            : "border-zinc-700 text-transparent hover:border-zinc-500"
                                    )}
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                </button>

                                {/* Content */}
                                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                    <div className="md:col-span-6">
                                        <h3 className={cn(
                                            "font-medium text-sm transition-all truncate font-sans",
                                            task.status === 'completed' ? "text-zinc-600 line-through" : "text-zinc-200"
                                        )}>
                                            {task.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-medium mt-1 uppercase tracking-wider">
                                            <span>{task.team?.name || "Unassigned"}</span>
                                            {task.requiredSkill && (
                                                <>
                                                    <span className="text-zinc-800">|</span>
                                                    <span>{task.requiredSkill}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Priority */}
                                    <div className="md:col-span-3 flex items-center">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium border uppercase tracking-wide rounded",
                                            getPriorityColor(task.priority)
                                        )}>
                                            <Flag className="w-3 h-3" />
                                            {task.priority || "Normal"}
                                        </span>
                                    </div>

                                    {/* Date */}
                                    <div className="md:col-span-3 flex items-center gap-2 text-xs text-zinc-500 font-mono justify-end">
                                        {task.deadline && (
                                            <>
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Hover Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pl-4 border-l border-zinc-800 ml-4">
                                    {task.status !== 'in-progress' && task.status !== 'completed' && (
                                        <button
                                            onClick={(e) => handleStatusUpdate(task.id, 'in-progress', e)}
                                            className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-950/30 transition-colors rounded-md"
                                            title="Start Task"
                                        >
                                            <Play className="w-4 h-4" />
                                        </button>
                                    )}

                                    {task.status === 'in-progress' && (
                                        <button
                                            onClick={(e) => handleStatusUpdate(task.id, 'active', e)}
                                            className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-950/30 transition-colors rounded-md"
                                            title="Pause Task"
                                        >
                                            <Pause className="w-4 h-4" />
                                        </button>
                                    )}

                                    <button
                                        onClick={(e) => handleStatusUpdate(task.id, 'blocked', e)}
                                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors rounded-md"
                                        title="Block Task"
                                    >
                                        <Ban className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-24 border border-zinc-900 border-dashed bg-card/50 rounded-xl">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-zinc-900 rounded-lg mb-4">
                                <AlertCircle className="w-6 h-6 text-zinc-600" />
                            </div>
                            <h3 className="text-lg font-medium text-zinc-300 tracking-tight">No Tasks Found</h3>
                            <p className="text-zinc-600 mb-6 text-xs max-w-sm mx-auto">
                                No active tasks found matching current filter parameters.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onTaskCreated={refetch}
                currentUserId={userId}
            />

            {selectedTask && (
                <TaskDetailDrawer
                    selectedTask={selectedTask}
                    setSelectedTask={setSelectedTask}
                    updateTaskMutation={updateTaskMutation}
                    refreshTasks={refetch}
                />
            )}
        </div>
    );
}