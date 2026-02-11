import { Member, Task } from "./types";
import { cn } from "./utils";
import { User, AlertTriangle, Plus, Loader2, UserMinus, TrendingUp } from "lucide-react";

interface WorkloadAnalysisProps {
    members: Member[] | undefined;
    tasksByMember: Record<string, Task[]>;
    totalTasksCount: number;
    isLeader: boolean;
    isActualLeader: boolean;
    setSelectedMemberId: (id: string) => void;
    setCreateTaskModalOpen: (open: boolean) => void;
    handleRemoveMember: (id: string) => void;
    removeMemberMutationPending: boolean;
    isVisible: boolean;
}

export function WorkloadAnalysis({
    members,
    tasksByMember,
    totalTasksCount,
    isLeader,
    isActualLeader,
    setSelectedMemberId,
    setCreateTaskModalOpen,
    handleRemoveMember,
    removeMemberMutationPending,
    isVisible
}: WorkloadAnalysisProps) {
    if (!isVisible) return null;

    return (
        <section>
            <h2 className="text-sm font-semibold text-zinc-500 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Workload Analysis
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {members?.map((member) => {
                    const memberTasks = tasksByMember[member.id] || [];
                    const workload = totalTasksCount > 0 ? (memberTasks.length / totalTasksCount) * 100 : 0;
                    const isOverloaded = workload > 80;

                    return (
                        <div key={member.id} className="group relative bg-card border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 p-4 transition-all rounded-xl">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-300">{member.name}</h3>
                                        <p className="text-[10px] text-zinc-500">{member.skills?.[0] || "Generalist"}</p>
                                    </div>
                                </div>
                                {isOverloaded && <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />}
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
                                    <span>{memberTasks.length} Tasks</span>
                                    <span>{Math.round(workload)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-900 overflow-hidden rounded-full">
                                    <div
                                        className={cn("h-full transition-all duration-500 rounded-full",
                                            workload > 80 ? "bg-red-500" : workload > 50 ? "bg-amber-500" : "bg-emerald-500"
                                        )}
                                        style={{ width: `${workload}%` }}
                                    />
                                </div>
                            </div>

                            {isLeader && (
                                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedMemberId(member.id);
                                            setCreateTaskModalOpen(true);
                                        }}
                                        className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors rounded hover:bg-zinc-200 dark:hover:bg-zinc-800"
                                        title="Assign Task"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                    {isActualLeader && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRemoveMember(member.id); }}
                                            disabled={removeMemberMutationPending}
                                            className="p-1 text-zinc-500 hover:text-red-500 transition-colors rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-50"
                                            title="Remove Member"
                                        >
                                            {removeMemberMutationPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
