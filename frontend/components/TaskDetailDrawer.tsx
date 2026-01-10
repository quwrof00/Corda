import { Pause, Play, X, Calendar, Users, Flag } from "lucide-react"
import cn from "clsx"
import { Task } from "@/hooks/useTasks";
import { UseMutationResult } from "@tanstack/react-query";

interface TaskDetailDrawerProps {
    selectedTask: Task | null;
    setSelectedTask: (task: Task | null) => void;
    updateTaskMutation: UseMutationResult<unknown, Error, { id: string;[key: string]: unknown }, unknown>; // Typed for usage
    refreshTasks: () => void;
}

export default function TaskDetailDrawer({ selectedTask, setSelectedTask, updateTaskMutation, refreshTasks }: TaskDetailDrawerProps) {

    const handleStatusUpdate = async (status: string) => {
        if (!selectedTask) return;
        try {
            await updateTaskMutation.mutateAsync({
                id: selectedTask.id,
                status: status
            });
            // Auto close on completion for better workflow flow, optional but keeps it clean
            if (status === 'completed') {
                setSelectedTask(null);
            }
            refreshTasks();
        } catch (e) {
            console.error("Failed to update task", e);
            // Could add toast notification here
        }
    };

    if (!selectedTask) return null;

    // Normalize data fields since we might get slightly different shapes from different endpoints
    const taskTeamName = selectedTask.team?.name || "Unassigned"; // handle complex nested or flat relations
    const taskDescription = selectedTask.desc || selectedTask.description || "No description provided for this task.";
    const taskDeadline = selectedTask.deadline;

    return (
        <div>
            <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={() => setSelectedTask(null)}>
                <div
                    className="w-full max-w-md bg-card h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-zinc-800"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-900">
                        <h2 className="text-xl font-bold text-white">Task Details</h2>
                        <button
                            onClick={() => setSelectedTask(null)}
                            className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-white transition-colors"
                            aria-label="Close Drawer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className={cn("px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border",
                                    selectedTask.priority === 'High' ? "bg-red-950/20 text-red-400 border-red-900/50" :
                                        selectedTask.priority === 'Medium' ? "bg-amber-950/20 text-amber-400 border-amber-900/50" :
                                            "bg-green-950/20 text-green-400 border-green-900/50"
                                )}>
                                    {selectedTask.priority || "Normal"} Priority
                                </span>
                                <span className={cn("px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border",
                                    selectedTask.status === 'active' || selectedTask.status === 'in-progress' ? "bg-blue-950/20 text-blue-400 border-blue-900/50" : "bg-zinc-900 text-zinc-500 border-zinc-800"
                                )}>
                                    {selectedTask.status}
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-white leading-tight break-words">{selectedTask.title}</h3>
                        </div>

                        <div className="p-5 rounded-xl bg-zinc-900/30 border border-zinc-800 space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500 flex items-center gap-2"><Users className="w-4 h-4" /> Team</span>
                                <span className="font-medium text-zinc-200">{taskTeamName}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Due Date</span>
                                <span className="font-medium text-zinc-200">
                                    {taskDeadline ? new Date(taskDeadline).toLocaleDateString() : "No Date"}
                                </span>
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
                            <div className="text-sm text-zinc-400 leading-relaxed p-4 bg-zinc-900/30 rounded-xl border border-zinc-800 min-h-[100px] whitespace-pre-wrap">
                                {taskDescription}
                            </div>
                        </div>

                        <div className="pt-6 mt-auto flex gap-3 border-t border-zinc-900">
                            {selectedTask.status !== 'in-progress' && selectedTask.status !== 'completed' && (
                                <button
                                    onClick={() => handleStatusUpdate('in-progress')}
                                    disabled={updateTaskMutation.isPending}
                                    className="flex-1 py-3 bg-zinc-100 text-black font-bold rounded-xl hover:bg-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Play className="w-4 h-4" />
                                    {updateTaskMutation.isPending ? "Updating..." : "Start Task"}
                                </button>
                            )}
                            {selectedTask.status === 'in-progress' && (
                                <button
                                    onClick={() => handleStatusUpdate('active')}
                                    disabled={updateTaskMutation.isPending}
                                    className="flex-1 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Pause className="w-4 h-4" />
                                    {updateTaskMutation.isPending ? "Updating..." : "Pause Task"}
                                </button>
                            )}
                            <button
                                onClick={() => handleStatusUpdate('completed')}
                                disabled={updateTaskMutation.isPending}
                                className={cn(
                                    "px-6 py-3 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold rounded-xl hover:bg-zinc-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                                    (selectedTask.status === 'completed') && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {selectedTask.status === 'completed' ? "Completed" : "Complete"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}