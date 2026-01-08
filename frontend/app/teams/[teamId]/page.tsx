"use client";

import { useParams, useRouter } from "next/navigation";
import { useTeam, useTeamMembers, useDeleteTeam, useRemoveMember, useUpdateTeam } from "@/hooks/useTeams";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { api } from "@/lib/api";
import { useSession } from "next-auth/react";
import { useState, useMemo } from "react";
import {
    ArrowLeft,
    BrainCircuit,
    CheckCircle2,
    Loader2,
    Plus,
    User,
    Users,
    Trash2,
    UserMinus,
    Settings,
    AlertTriangle,
    TrendingUp,
    AlertOctagon,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import CreateTaskModal from "@/components/CreateTaskModal";
import ConfirmModal from "@/components/ConfirmModal";

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface Member {
    id: string;
    name: string;
    email: string;
    skills?: string[];
}

interface Task {
    id: string;
    title: string;
    desc?: string;
    status: string;
    priority: string;
    requiredSkill?: string;
    assignedTo?: { id: string; name: string };
    assignedToId?: string | null;
}

export default function TeamDetailsPage() {
    const params = useParams();
    const teamId = params?.teamId as string;
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: session } = useSession();

    const { data: team, isLoading: teamLoading } = useTeam(teamId);
    const { data: members, isLoading: membersLoading } = useTeamMembers(teamId);
    const { data: tasks, isLoading: tasksLoading } = useTasks(teamId);

    const deleteTeamMutation = useDeleteTeam();
    const removeMemberMutation = useRemoveMember();
    // const deleteTaskMutation = useDeleteTask(); // Unused
    const updateTeamMutation = useUpdateTeam();
    const updateTaskMutation = useUpdateTask();

    const [allocating, setAllocating] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState("");

    const [teamModalOpen, setTeamModalOpen] = useState(false);
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        description: "",
        onConfirm: () => { },
        variant: "danger" as "danger" | "warning",
        confirmText: "Confirm"
    });

    const [editingTeamName, setEditingTeamName] = useState("");
    const [editingTeamDesc, setEditingTeamDesc] = useState("");
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const unassignedTasks = useMemo(() => (tasks as Task[])?.filter((t) => !t.assignedTo) || [], [tasks]);
    const assignedTasks = useMemo(() => (tasks as Task[])?.filter((t) => t.assignedTo) || [], [tasks]);

    const tasksByMember = useMemo(() => {
        const map: Record<string, Task[]> = {};
        (members as Member[])?.forEach((m) => map[m.id] = []);
        assignedTasks.forEach((t) => {
            if (t.assignedTo && map[t.assignedTo.id]) map[t.assignedTo.id].push(t);
        });
        return map;
    }, [members, assignedTasks]);

    const handleRemoveMember = async (userId: string) => {
        setConfirmModal({
            isOpen: true,
            title: "Remove Member",
            description: "Are you sure you want to remove this member? They will be removed from all assigned tasks.",
            variant: "danger",
            confirmText: "Remove Member",
            onConfirm: async () => {
                await removeMemberMutation.mutateAsync({ teamId, userId });
                queryClient.invalidateQueries({ queryKey: ["teamMembers", teamId] });
                toast.success("Member removed successfully");
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    }

    const handleDeleteTeam = async () => {
        setConfirmModal({
            isOpen: true,
            title: "Delete Team",
            description: "Are you sure you want to delete this team? This action cannot be undone and all data will be lost.",
            variant: "danger",
            confirmText: "Delete Team",
            onConfirm: async () => {
                await deleteTeamMutation.mutateAsync(teamId);
                toast.success("Team deleted successfully");
                router.push("/teams");
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    }

    const handleSaveTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateTeamMutation.mutateAsync({
                id: teamId,
                name: editingTeamName,
                description: editingTeamDesc
            });
            queryClient.invalidateQueries({ queryKey: ["team", teamId] });
            toast.success("Team updated successfully");
            setTeamModalOpen(false);
        } catch (err) {
            console.error(err);
            toast.error("Failed to update team");
        }
    };

    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTask) return;
        try {
            await updateTaskMutation.mutateAsync({
                id: editingTask.id,
                title: editingTask.title,
                description: editingTask.desc,
                priority: editingTask.priority,
                requiredSkill: editingTask.requiredSkill,
                status: editingTask.status,
                assignedToId: editingTask.assignedToId || null
            });
            queryClient.invalidateQueries({ queryKey: ["tasks", teamId] });
            toast.success("Task updated successfully");
            setTaskModalOpen(false);
            setEditingTask(null);
        } catch (err) {
            console.error(err);
            toast.error("Failed to update task");
        }
    };

    const handleAllocate = async () => {
        setConfirmModal({
            isOpen: true,
            title: "Auto-Allocate Tasks",
            description: "This will automatically assign unassigned tasks to the most suitable members based on skills and workload. Continue?",
            variant: "warning",
            confirmText: "Start Allocation",
            onConfirm: async () => {
                setAllocating(true);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await api.post(`/allocator/${teamId}/allocate`);
                    queryClient.invalidateQueries({ queryKey: ["tasks", teamId] });
                    queryClient.invalidateQueries({ queryKey: ["teamMembers", teamId] });
                    toast.success("Allocation process completed");
                } catch (error) {
                    console.error(error);
                    toast.error("Allocation failed");
                } finally {
                    setAllocating(false);
                }
            }
        });
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteLoading(true);
        setInviteLink("");
        try {
            const res = await api.post(`/teams/${teamId}/invite`, { email: inviteEmail });
            if (res.data.link) {
                setInviteLink(res.data.link);
                toast.success("Invite link generated");
            } else {
                toast.success("Invite sent successfully");
                setInviteModalOpen(false);
                setInviteEmail("");
            }
        } catch (error: unknown) {
            // @ts-expect-error: error type is unknown but we expect axios response
            toast.error(error.response?.data?.error || "Failed to send invite");
        } finally {
            setInviteLoading(false);
        }
    };

    const openEditTeam = () => {
        setEditingTeamName(team.name);
        setEditingTeamDesc(team.desc || "");
        setTeamModalOpen(true);
    };

    const openEditTask = (task: Task) => {
        setEditingTask({ ...task, assignedToId: task.assignedTo?.id || null });
        setTaskModalOpen(true);
    };

    if (teamLoading || membersLoading || tasksLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-background text-zinc-500 font-sans">
                <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Loading Team...
                </div>
            </div>
        );
    }

    if (!team) return <div className="p-10 text-center bg-background text-zinc-500 font-sans">Team Not Found</div>;

    const isLeader = session?.user?.email === team.leader?.email;

    return (
        <main className="min-h-screen bg-background text-zinc-300 font-sans pb-20 selection:bg-zinc-800">
            {/* Header */}
            <header className="bg-card border-b border-zinc-900 sticky top-0 z-30">
                <div className="px-6 py-5 max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <button onClick={() => router.push("/teams")} className="p-2 -ml-2 text-zinc-500 hover:text-zinc-200 transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 font-bold text-xl rounded-lg">
                                {team.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                                    {team.name}
                                    {isLeader && (
                                        <button onClick={openEditTeam} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                                            <Settings className="w-4 h-4" />
                                        </button>
                                    )}
                                </h1>
                                <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500 font-medium">
                                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {members?.length} Members</span>
                                    <span className="text-zinc-700">|</span>
                                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {assignedTasks.length} Active Tasks</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {isLeader && (
                                <button
                                    onClick={() => setInviteModalOpen(true)}
                                    className="px-4 py-2 text-xs font-bold text-zinc-400 border border-zinc-800 bg-background hover:bg-zinc-900 hover:text-white transition-colors rounded-lg"
                                >
                                    Invite Member
                                </button>
                            )}
                            {isLeader && (
                                <>
                                    <button
                                        onClick={() => setCreateTaskModalOpen(true)}
                                        className="px-4 py-2 text-xs font-bold text-black bg-zinc-100 hover:bg-white transition-colors flex items-center gap-2 rounded-lg"
                                    >
                                        <Plus className="w-3 h-3" /> New Task
                                    </button>
                                    <button
                                        onClick={handleAllocate}
                                        disabled={allocating}
                                        className="px-4 py-2 text-xs font-bold text-emerald-400 border border-emerald-900/30 bg-emerald-950/10 hover:bg-emerald-950/30 transition-colors flex items-center gap-2 disabled:opacity-50 rounded-lg"
                                    >
                                        {allocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <BrainCircuit className="w-3 h-3" />}
                                        Auto-Allocate
                                    </button>
                                    <button
                                        onClick={handleDeleteTeam}
                                        className="px-4 py-2 text-xs font-bold text-red-500 border border-red-900/30 bg-red-950/10 hover:bg-red-950/30 transition-colors flex items-center gap-2 rounded-lg"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 space-y-8 mt-8">

                {/* Workload */}
                <section>
                    <h2 className="text-sm font-semibold text-zinc-500 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Workload Analysis
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {(members as Member[])?.map((member) => {
                            const memberTasks = tasksByMember[member.id] || [];
                            const workload = Math.min(100, (memberTasks.length / 5) * 100);
                            const isOverloaded = workload > 80;

                            return (
                                <div key={member.id} className="group relative bg-card border border-zinc-900 hover:border-zinc-700 p-4 transition-all rounded-xl">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-zinc-900 flex items-center justify-center text-zinc-500 rounded-lg border border-zinc-800">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-bold text-zinc-300">{member.name}</h3>
                                                <p className="text-[10px] text-zinc-500">{member.skills?.[0] || "Generalist"}</p>
                                            </div>
                                        </div>
                                        {isOverloaded && <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />}
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
                                            <span>Capacity</span>
                                            <span>{Math.round(workload)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-zinc-900 overflow-hidden rounded-full">
                                            <div
                                                className={cn("h-full transition-all duration-500 rounded-full",
                                                    workload > 80 ? "bg-red-500" : workload > 50 ? "bg-amber-500" : "bg-emerald-500"
                                                )}
                                                style={{ width: `${workload}%` }}
                                            />
                                        </div>
                                    </div>

                                    {isLeader && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRemoveMember(member.id); }}
                                            className="absolute top-2 right-2 p-1 text-zinc-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 rounded"
                                        >
                                            <UserMinus className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Task Dashboard */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                    {/* Unassigned */}
                    <div className="bg-card border border-zinc-900 flex flex-col rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/20">
                            <h3 className="text-xs font-bold text-zinc-400 flex items-center gap-2">
                                <AlertOctagon className="w-3 h-3" /> Unassigned Tasks
                            </h3>
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{unassignedTasks.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 p-3 scrollbar-custom">
                            {unassignedTasks.map((task) => (
                                <div key={task.id}
                                    onClick={() => isLeader && openEditTask(task)}
                                    className="bg-zinc-900 border border-zinc-800 p-3 hover:border-zinc-600 cursor-pointer transition-colors group rounded-lg"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={cn("text-[10px] font-medium border px-1.5 py-0.5 rounded-md",
                                            task.priority === 'High' ? "border-red-900/50 text-red-500 bg-red-900/10" : "border-zinc-800 text-zinc-500 bg-zinc-900"
                                        )}>{task.priority}</span>
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

                    {/* Assigned */}
                    <div className="lg:col-span-2 bg-card border border-zinc-900 flex flex-col rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-zinc-900 bg-zinc-900/20">
                            <h3 className="text-xs font-bold text-zinc-400 flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3" /> Member Tasks
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 p-4 scrollbar-custom">
                            {(members as Member[])?.map((member) => (
                                <div key={member.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
                                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-900">
                                        <div className="w-2 h-2 bg-emerald-500/50 rounded-full" />
                                        <span className="text-xs font-bold text-zinc-300">{member.name}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {(tasksByMember[member.id] || []).map((task) => (
                                            <div
                                                key={task.id}
                                                onClick={() => openEditTask(task)}
                                                className={cn(
                                                    "bg-card p-2 border border-zinc-900 hover:border-zinc-700 cursor-pointer transition-colors text-xs text-zinc-400 ml-3 border-l-2 rounded-r-md group",
                                                    task.status === 'completed' ? "border-l-emerald-500 hover:border-l-emerald-400" :
                                                        task.status === 'in-progress' ? "border-l-blue-500 hover:border-l-blue-400" :
                                                            task.status === 'blocked' ? "border-l-red-500 hover:border-l-red-400" :
                                                                "border-l-zinc-800 hover:border-l-zinc-500"
                                                )}
                                            >
                                                <div className="flex justify-between items-center gap-2">
                                                    <p className={cn("line-clamp-1 flex-1", task.status === 'completed' && "line-through opacity-70")}>{task.title}</p>
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
            </div>

            {/* Invite Modal */}
            {inviteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-card border border-zinc-800 p-6 shadow-2xl rounded-2xl">
                        <h3 className="text-sm font-bold text-white mb-6 border-b border-zinc-800 pb-2">Invite New Member</h3>
                        {!inviteLink ? (
                            <form onSubmit={handleInvite} className="space-y-4">
                                <input type="email" placeholder="Email Address" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm outline-none focus:border-zinc-500 rounded-xl" required />
                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" onClick={() => setInviteModalOpen(false)} className="px-4 py-2 text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>
                                    <button type="submit" disabled={inviteLoading} className="px-4 py-2 bg-white text-black text-xs font-bold hover:bg-zinc-200 rounded-lg">{inviteLoading ? "Sending..." : "Send Invite"}</button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-emerald-500 text-xs">Link Generated Successfully.</p>
                                <input readOnly value={inviteLink} className="w-full p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono cursor-text select-all rounded-xl" />
                                <button onClick={() => setInviteModalOpen(false)} className="w-full py-2 bg-zinc-800 text-white text-xs font-bold hover:bg-zinc-700 rounded-lg">Done</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Create Task Modal */}
            <CreateTaskModal
                isOpen={createTaskModalOpen}
                onClose={() => setCreateTaskModalOpen(false)}
                initialTeamId={teamId}
                onTaskCreated={() => {
                    queryClient.invalidateQueries({ queryKey: ["tasks", teamId] });
                }}
            />

            {/* Edit Taks/Team Modals */}
            {(teamModalOpen || taskModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-card p-6 border border-zinc-800 w-full max-w-lg shadow-2xl rounded-2xl">
                        {teamModalOpen && (
                            <form onSubmit={handleSaveTeam} className="space-y-4">
                                <h3 className="text-sm font-bold text-white mb-4">Edit Team</h3>
                                <input value={editingTeamName} onChange={e => setEditingTeamName(e.target.value)} className="w-full p-3 bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm rounded-xl" placeholder="Team Name" />
                                <textarea value={editingTeamDesc} onChange={e => setEditingTeamDesc(e.target.value)} className="w-full p-3 bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm h-32 rounded-xl resize-none" placeholder="Description" />
                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" onClick={() => setTeamModalOpen(false)} className="text-zinc-500 hover:text-zinc-300 text-xs">Cancel</button>
                                    <button type="submit" className="bg-white text-black px-4 py-2 text-xs font-bold rounded-lg">Save</button>
                                </div>
                            </form>
                        )}
                        {taskModalOpen && editingTask && (
                            <form onSubmit={handleSaveTask} className="space-y-4">
                                <h3 className="text-sm font-bold text-white mb-4">Edit Task</h3>
                                <input value={editingTask.title} onChange={e => setEditingTask({ ...editingTask, title: e.target.value })} className="w-full p-3 bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm rounded-xl" placeholder="Task Title" />
                                <select value={editingTask.assignedToId || ""} onChange={e => setEditingTask({ ...editingTask, assignedToId: e.target.value })} className="w-full p-3 bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm rounded-xl">
                                    <option value="">-- Unassigned --</option>
                                    {members?.map((m: Member) => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" onClick={() => setTaskModalOpen(false)} className="text-zinc-500 hover:text-zinc-300 text-xs">Cancel</button>
                                    <button type="submit" className="bg-white text-black px-4 py-2 text-xs font-bold rounded-lg">Save</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                description={confirmModal.description}
                variant={confirmModal.variant}
                confirmText={confirmModal.confirmText}
            />
        </main>
    );
}
