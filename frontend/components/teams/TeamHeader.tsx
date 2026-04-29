import { LoadingBars } from "@/components/shared/LoadingBars";
import { ArrowLeft, Lock, Settings, Users, CheckCircle2, Plus, BrainCircuit, Trash2, Pen } from "lucide-react";
import { cn } from "./utils";
import { Member, Task, Team } from "./types";
interface AppRouterInstance {
    push: (href: string) => void;
    replace: (href: string) => void;
    refresh: () => void;
    back: () => void;
    forward: () => void;
}


interface TeamHeaderProps {
    team: Team;
    isScrolled: boolean;
    router: AppRouterInstance;
    isPersonal: boolean;
    isLeader: boolean;
    isActualLeader: boolean;
    members: Member[] | undefined;
    assignedTasks: Task[];
    openEditTeam: () => void;
    setInviteModalOpen: (open: boolean) => void;
    setSelectedMemberId: (id: string) => void;
    currentUserMemberId?: string;
    setCreateTaskModalOpen: (open: boolean) => void;
    handleAllocate: () => void;
    allocating: boolean;
    handleDeleteTeam: () => void;
    onOpenScratchpad: () => void;
}

export function TeamHeader({
    team,
    isScrolled,
    router,
    isPersonal,
    isLeader,
    isActualLeader,
    members,
    assignedTasks,
    openEditTeam,
    setInviteModalOpen,
    setSelectedMemberId,
    currentUserMemberId,
    setCreateTaskModalOpen,
    handleAllocate,
    allocating,
    handleDeleteTeam,
    onOpenScratchpad
}: TeamHeaderProps) {
    return (
        <header className={cn("border-b border-zinc-200 dark:border-zinc-800 sticky top-16 md:top-0 z-30 transition-all duration-300", isScrolled ? "bg-white/90 dark:bg-black/90 backdrop-blur-md shadow-lg" : "bg-card")}>
            <div className="px-4 sm:px-6 py-5 max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <button onClick={() => router.push("/teams")} className="p-2 -ml-2 text-zinc-500 hover:text-zinc-200 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-200 font-bold text-xl rounded-lg">
                            {isPersonal ? <Lock className="w-6 h-6 text-zinc-500" /> : team.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
                                {isPersonal ? "Personal" : team.name}
                                {isActualLeader && !isPersonal && (
                                    <button onClick={openEditTeam} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                                        <Settings className="w-4 h-4" />
                                    </button>
                                )}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-zinc-500 font-medium">
                                {!isPersonal && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {members?.length} Members</span>}
                                {!isPersonal && <span className="text-zinc-700">|</span>}
                                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {assignedTasks.length} Active Tasks</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {!isPersonal && (
                            <button
                                onClick={onOpenScratchpad}
                                className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 bg-background hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white transition-all rounded-lg flex items-center gap-2 group"
                            >
                                <Pen className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
                                Scratchpad
                            </button>
                        )}
                        {isLeader && !isPersonal && (
                            <button
                                onClick={() => setInviteModalOpen(true)}
                                disabled={allocating}
                                className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 bg-background hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-lg disabled:opacity-50"
                            >
                                Invite Member
                            </button>
                        )}
                        {isLeader && (
                            <>
                                <button
                                    onClick={() => {
                                        if (isPersonal) {
                                            setSelectedMemberId(currentUserMemberId || "");
                                        }
                                        setCreateTaskModalOpen(true);
                                    }}
                                    disabled={allocating}
                                    className="px-4 py-2 text-xs font-bold text-white dark:text-black bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white transition-colors flex items-center gap-2 rounded-lg disabled:opacity-50"
                                >
                                    <Plus className="w-3 h-3" /> New Task
                                </button>
                                {!isPersonal && (
                                    <button
                                        onClick={handleAllocate}
                                        disabled={allocating}
                                        className="px-4 py-2 text-xs font-bold text-emerald-400 border border-emerald-900/30 bg-emerald-950/10 hover:bg-emerald-950/30 transition-colors flex items-center gap-2 disabled:opacity-50 rounded-lg"
                                    >
                                        {allocating ? <LoadingBars className="w-3 h-3" /> : <BrainCircuit className="w-3 h-3" />}
                                        Auto-Allocate
                                    </button>
                                )}
                                {isActualLeader && !isPersonal && (
                                    <button
                                        onClick={handleDeleteTeam}
                                        disabled={allocating}
                                        className="px-4 py-2 text-xs font-bold text-red-500 border border-red-900/30 bg-red-950/10 hover:bg-red-950/30 transition-colors flex items-center gap-2 rounded-lg disabled:opacity-50"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
