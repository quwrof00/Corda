import { LoadingBars } from "@/components/shared/LoadingBars";
import { useMemo } from "react";
import { Member, Task } from "./types";
import { cn } from "./utils";
import { User, AlertTriangle, Plus, UserMinus, TrendingUp } from "lucide-react";
import { useBatchedItems } from "@/hooks/useBatchedItems";
import { useModalStore } from "@/hooks/useModalStore";

interface WorkloadAnalysisProps {
    members: Member[] | undefined;
    allTasks: Task[];
    tasksByMember: Record<string, Task[]>;
    isLeader: boolean;
    isActualLeader: boolean;
    handleRemoveMember: (id: string) => void;
    removeMemberMutationPending: boolean;
    isVisible: boolean;
}

export function WorkloadAnalysis({
    members,
    allTasks,
    tasksByMember,
    isLeader,
    isActualLeader,
    handleRemoveMember,
    removeMemberMutationPending,
    isVisible
}: WorkloadAnalysisProps) {
    const { openTaskModal } = useModalStore();
    const {
        visibleItems: visibleMembers,
        hasMore,
        sentinelRef,
    } = useBatchedItems((members as Member[]) || [], 8);

    // 1. Skill Gap Logic
    const missingSkills = useMemo(() => {
        if (!members || !allTasks) return [];
        const collectiveSkills = new Set((members as Member[]).flatMap(m => m.skills || []).map(s => s.toLowerCase()));
        const requiredSkills = new Set((allTasks as Task[]).filter(t => t.requiredSkill).map(t => t.requiredSkill!.toLowerCase()));
        
        return Array.from(requiredSkills).filter(s => !collectiveSkills.has(s));
    }, [members, allTasks]);

    if (!isVisible) return null;

    // 2. Stress Score Helper
    const calculateStress = (memberTasks: Task[]) => {
        if (memberTasks.length === 0) return 0;
        
        const priorityScore = memberTasks.reduce((acc, task) => {
            const p = task.priority?.toLowerCase();
            if (p === 'high') return acc + 25;
            if (p === 'medium') return acc + 10;
            return acc + 5;
        }, 0);

        // Limit to 100
        return Math.min(100, (memberTasks.length * 5) + priorityScore);
    };

    return (
        <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-sm font-semibold text-zinc-500 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Productivity & Stress Levels
                </h2>
                
                {missingSkills.length > 0 && isLeader && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-600 dark:text-amber-500 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Skill Gap Detected: {missingSkills.join(", ")}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {visibleMembers.map((member) => {
                    const memberTasks = tasksByMember[member.id] || [];
                    const stressLevel = calculateStress(memberTasks);
                    const isExtreme = stressLevel > 70;

                    return (
                        <div key={member.id} className={cn(
                            "group relative bg-card border p-4 transition-all rounded-xl",
                            isExtreme 
                                ? "border-red-500/30 bg-red-500/[0.02] dark:bg-red-500/[0.01]" 
                                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                        )}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-8 h-8 flex items-center justify-center rounded-lg border",
                                        isExtreme 
                                            ? "bg-red-500/10 border-red-500/20 text-red-500" 
                                            : "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500"
                                    )}>
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-300">{member.name}</h3>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-tight">{member.skills?.[0] || "Generalist"}</p>
                                    </div>
                                </div>
                                {isExtreme && <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-bounce" />}
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] items-end">
                                    <span className="text-zinc-500 font-bold uppercase tracking-wider">{memberTasks.length} Assigned</span>
                                    <span className={cn(
                                        "font-bold px-1.5 py-0.5 rounded text-[9px] uppercase",
                                        stressLevel > 70 ? "bg-red-500 text-white" : stressLevel > 40 ? "bg-amber-500 text-white" : "bg-emerald-500/10 text-emerald-500"
                                    )}>
                                        {stressLevel > 70 ? "Critical" : stressLevel > 40 ? "Stressed" : "Optimal"}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-900 overflow-hidden rounded-full">
                                    <div
                                        className={cn("h-full transition-all duration-700 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.15)]",
                                            stressLevel > 70 ? "bg-red-500" : stressLevel > 40 ? "bg-amber-500" : "bg-emerald-500"
                                        )}
                                        style={{ width: `${stressLevel}%` }}
                                    />
                                </div>
                            </div>

                            {isLeader && (
                                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openTaskModal({ assignedToId: member.id });
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
                                            {removeMemberMutationPending ? <LoadingBars className="w-3.5 h-3.5" /> : <UserMinus className="w-3.5 h-3.5" />}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
                {hasMore && <div ref={sentinelRef} className="h-4 w-full md:col-span-2 lg:col-span-4" />}
            </div>
        </section>
    );
}
