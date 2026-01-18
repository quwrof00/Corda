import { Member, Task } from "./types";
import { cn, formatDaysLeft } from "./utils";
import { AlertOctagon, CheckCircle2 } from "lucide-react";

interface TeamTaskBoardProps {
    mobileTab: "workload" | "unassigned" | "assigned";
    unassignedTasks: Task[];
    assignedTasks: Task[]; // Note: Parent assignedTasks is simple array, but here we need tasksByMember. Actually let's look at logic.
    // The right column iterates members and shows thier tasks.
    members: Member[] | undefined;
    tasksByMember: Record<string, Task[]>;
    isLeader: boolean;
    openEditTask: (task: Task) => void;
}

export function TeamTaskBoard({
    mobileTab,
    unassignedTasks,
    members,
    tasksByMember,
    isLeader,
    openEditTask
}: TeamTaskBoardProps) {
    return (
        <section className={cn("grid gap-6 h-[600px] grid-cols-1 lg:grid-cols-3")}>
            {/* Unassigned Tasks (Left Col) */}
            <div className={cn("bg-card border border-zinc-800 flex flex-col rounded-xl overflow-hidden", mobileTab !== "unassigned" && "hidden lg:flex")}>
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/20">
                    <h3 className="text-xs font-bold text-zinc-400 flex items-center gap-2">
                        <AlertOctagon className="w-3 h-3" /> Unassigned Tasks
                    </h3>
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{unassignedTasks.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 p-3 scrollbar-custom">
                    {unassignedTasks.map((task) => (
                        <div key={task.id}
                            onClick={() => isLeader && openEditTask(task)}
                            className={cn(
                                "bg-zinc-900 border border-zinc-800 p-3 transition-colors group rounded-lg",
                                isLeader ? "cursor-pointer hover:border-zinc-600" : "cursor-default"
                            )}
                            title={task.requiredSkill ? `Skill: ${task.requiredSkill}` : undefined}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={cn("text-[10px] font-medium border px-1.5 py-0.5 rounded-md",
                                        task.priority === 'High' ? "border-red-900/50 text-red-500 bg-red-900/10" : "border-zinc-800 text-zinc-500 bg-zinc-900"
                                    )}>{task.priority}</span>
                                    {task.deadline && (
                                        <span className={cn("text-[10px] font-medium border px-1.5 py-0.5 rounded-md",
                                            new Date(task.deadline) < new Date() ? "border-red-900/30 text-red-400 bg-red-950/10" : "border-zinc-800 text-zinc-500 bg-zinc-900"
                                        )}>
                                            {formatDaysLeft(task.deadline)}
                                        </span>
                                    )}
                                </div>
                                {task.requiredSkill && <span className="text-[10px] text-zinc-500">[{task.requiredSkill}]</span>}
                            </div>
                            <h4 className="text-xs font-medium text-zinc-300 line-clamp-2 group-hover:text-white">{task.title}</h4>
                        </div>
                    ))}
                    {unassignedTasks.length === 0 && (
                        <div className="text-center py-10 text-zinc-700 text-xs">
                            No tasks unassigned
                        </div>
                    )}
                </div>
            </div>

            {/* Assigned / Member Tasks (Right Col) */}
            <div className={cn("bg-card border border-zinc-800 flex flex-col rounded-xl overflow-hidden lg:col-span-2", mobileTab !== "assigned" && "hidden lg:flex")}>
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/20">
                    <h3 className="text-xs font-bold text-zinc-400 flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3" /> Member Tasks
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 p-4 scrollbar-custom">
                    {(members as Member[])?.map((member) => (
                        <div key={member.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-800">
                                <div className="w-2 h-2 bg-emerald-500/50 rounded-full" />
                                <span className="text-xs font-bold text-zinc-300">{member.name}</span>
                            </div>
                            <div className="space-y-2">
                                {(tasksByMember[member.id] || []).map((task) => (
                                    <div
                                        key={task.id}
                                        onClick={() => isLeader && openEditTask(task)}
                                        title={task.requiredSkill ? `Skill: ${task.requiredSkill}` : undefined}
                                        className={cn(
                                            "bg-card p-2 border border-zinc-800 transition-colors text-xs text-zinc-400 ml-3 border-l-2 rounded-r-md group relative",
                                            isLeader ? "cursor-pointer hover:border-zinc-700" : "cursor-default",
                                            task.status === 'completed' ? "border-l-emerald-500 hover:border-l-emerald-400" :
                                                task.status === 'in-progress' ? "border-l-blue-500 hover:border-l-blue-400" :
                                                    task.status === 'blocked' ? "border-l-red-500 hover:border-l-red-400" :
                                                        "border-l-zinc-800 hover:border-l-zinc-500"
                                        )}
                                    >
                                        <div className="flex justify-between items-center gap-2">
                                            <p className={cn("line-clamp-1 flex-1", task.status === 'completed' && "line-through opacity-70")}>{task.title}</p>
                                            {task.requiredSkill && (
                                                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[9px] text-zinc-500 bg-zinc-950/80 border border-zinc-800 px-1.5 py-0.5 rounded whitespace-nowrap hidden sm:inline-block">
                                                    {task.requiredSkill}
                                                </span>
                                            )}
                                            {task.deadline && (
                                                <span className={cn("text-[9px] px-1.5 py-0.5 rounded border ml-auto flex-shrink-0",
                                                    new Date(task.deadline) < new Date() ? "text-red-400 border-red-900/30 bg-red-950/10" : "text-zinc-500 border-zinc-800 bg-zinc-900"
                                                )}>
                                                    {formatDaysLeft(task.deadline)}
                                                </span>
                                            )}
                                            {task.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />}
                                        </div>
                                    </div>
                                ))}
                                {(tasksByMember[member.id] || []).length === 0 && (
                                    <div className="text-[10px] text-zinc-700 pl-3 italic">No tasks assigned</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
