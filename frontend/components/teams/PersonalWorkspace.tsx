import { Task } from "./types";
import { cn, formatDaysLeft } from "./utils";
import { CheckCircle2, Plus } from "lucide-react";

interface PersonalWorkspaceProps {
    assignedTasks: Task[];
    currentUserMemberId?: string;
    setSelectedMemberId: (id: string) => void;
    setCreateTaskModalOpen: (open: boolean) => void;
    openEditTask: (task: Task) => void;
}

export function PersonalWorkspace({
    assignedTasks,
    currentUserMemberId,
    setSelectedMemberId,
    setCreateTaskModalOpen,
    openEditTask
}: PersonalWorkspaceProps) {
    return (
        <div className="space-y-8">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-zinc-900/50 p-5 rounded-xl border border-zinc-800 flex flex-col justify-between h-32 relative overflow-hidden group">
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Pending Tasks</span>
                    <div>
                        <span className="text-4xl font-bold text-white">{assignedTasks.filter(t => t.status !== 'completed').length}</span>
                        <span className="text-zinc-500 text-xs ml-1">tasks</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-amber-500 h-full" style={{ width: `${(assignedTasks.filter(t => t.status !== 'completed').length / (assignedTasks.length || 1)) * 100}%` }} />
                    </div>
                </div>

                <div className="bg-zinc-900/50 p-5 rounded-xl border border-zinc-800 flex flex-col justify-between h-32 relative overflow-hidden group">
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">High Priority</span>
                    <div>
                        <span className="text-4xl font-bold text-white">{assignedTasks.filter(t => t.priority === 'High' && t.status !== 'completed').length}</span>
                        <span className="text-zinc-500 text-xs ml-1">critical</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-red-500 h-full" style={{ width: `${(assignedTasks.filter(t => t.priority === 'High' && t.status !== 'completed').length / (assignedTasks.length || 1)) * 100}%` }} />
                    </div>
                </div>

                <div className="bg-zinc-900/50 p-5 rounded-xl border border-zinc-800 flex flex-col justify-between h-32 relative overflow-hidden group">
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Completed</span>
                    <div>
                        <span className="text-4xl font-bold text-white">{assignedTasks.filter(t => t.status === 'completed').length}</span>
                        <span className="text-zinc-500 text-xs ml-1">done</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${(assignedTasks.filter(t => t.status === 'completed').length / (assignedTasks.length || 1)) * 100}%` }} />
                    </div>
                </div>

                <div className="bg-zinc-900/50 p-5 rounded-xl border border-zinc-800 flex flex-col justify-between h-32 relative overflow-hidden group">
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Workspace</span>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300">Private</div>
                        <div className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300">Secure</div>
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-2">Only you can see these tasks</p>
                </div>
            </div>

            {/* Main Task List */}
            <div className="bg-card border border-zinc-800 rounded-xl overflow-hidden min-h-[500px] flex flex-col">
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/20">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" /> My Personal Tasks
                    </h3>
                    <button
                        onClick={() => {
                            setSelectedMemberId(currentUserMemberId || "");
                            setCreateTaskModalOpen(true);
                        }}
                        className="text-xs flex items-center gap-1 font-bold text-zinc-400 hover:text-white transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Task
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-0">
                    {assignedTasks.length > 0 ? (
                        <div className="divide-y divide-zinc-900">
                            {assignedTasks.map((task) => (
                                <div
                                    key={task.id}
                                    onClick={() => openEditTask(task)}
                                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-zinc-900/40 transition-all cursor-pointer border-l-4 border-transparent hover:border-l-emerald-500"
                                >
                                    <div className="flex items-start gap-4 mb-3 sm:mb-0">
                                        <div
                                            className={cn("mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                                task.status === "completed"
                                                    ? "bg-emerald-500 border-emerald-500"
                                                    : "border-zinc-700 bg-transparent group-hover:border-zinc-500"
                                            )}
                                        >
                                            {task.status === "completed" && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <div>
                                            <h4 className={cn("font-medium text-base text-zinc-200 group-hover:text-white transition-colors",
                                                task.status === "completed" && "line-through text-zinc-500"
                                            )}>
                                                {task.title}
                                            </h4>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                {task.priority === 'High' && (
                                                    <span className="text-[10px] uppercase font-bold text-red-400 bg-red-950/20 px-1.5 py-0.5 rounded border border-red-900/30">High Priority</span>
                                                )}
                                                {task.deadline && (
                                                    <span className={cn("text-[11px] font-medium flex items-center gap-1",
                                                        new Date(task.deadline) < new Date() && task.status !== 'completed' ? "text-red-400" : "text-zinc-500"
                                                    )}>
                                                        {formatDaysLeft(task.deadline)}
                                                    </span>
                                                )}
                                                {task.requiredSkill && (
                                                    <span className="text-[11px] text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{task.requiredSkill}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-center">
                                        <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                            task.status === 'completed' ? "bg-emerald-950/10 text-emerald-500 border-emerald-900/30" :
                                                task.status === 'in-progress' ? "bg-blue-950/10 text-blue-500 border-blue-900/30" :
                                                    "bg-zinc-900 text-zinc-500 border-zinc-800"
                                        )}>
                                            {task.status.replace('-', ' ')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-20 text-center">
                            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-700 mb-4">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-zinc-400 font-medium mb-1">No tasks found</h3>
                            <p className="text-zinc-600 text-sm mb-6">Your personal workspace is clear.</p>
                            <button
                                onClick={() => {
                                    setSelectedMemberId(currentUserMemberId || "");
                                    setCreateTaskModalOpen(true);
                                }}
                                className="px-6 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-200 transition-colors"
                            >
                                Create First Task
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
