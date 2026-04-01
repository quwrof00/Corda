"use client";
import { TeamWorkspaceSkeleton } from "@/components/shared/SkeletonLoader";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTeam, useTeamMembers, useDeleteTeam, useRemoveMember, useUpdateTeam } from "@/hooks/useTeams";
import { flattenInfiniteTasks, useInfiniteTasks, useTasks, useUpdateTask, Task } from "@/hooks/useTasks";
import { api } from "@/lib/api";
import { AxiosError } from "axios";
import { useSession } from "next-auth/react";
import { useState, useMemo, useEffect, useRef } from "react";
import { usePersonalWorkspace } from "@/hooks/usePersonalWorkspace";
import { io, Socket } from "socket.io-client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import CreateTaskModal from "@/components/CreateTaskModal";
import TaskDetailDrawer from "@/components/TaskDetailDrawer";
import ConfirmModal from "@/components/ConfirmModal";
import { TeamHeader } from "@/components/teams/TeamHeader";
import { MobileNavTabs } from "@/components/teams/MobileNavTabs";
import { WorkloadAnalysis } from "@/components/teams/WorkloadAnalysis";
import { PersonalWorkspace } from "@/components/teams/PersonalWorkspace";
import { TeamTaskBoard } from "@/components/teams/TeamTaskBoard";
import { InviteModal, EditTeamModal } from "@/components/teams/TeamModals";
import { Member } from "@/components/teams/types";
import { cn } from "@/components/teams/utils";
import { TeamScratchpad } from "@/components/teams/TeamScratchpad";

interface AllocationUpdateData {
    type: 'autoalloc_started' | 'allocation_completed' | 'task_reallocated' | 'allocation_error' | 'task_created' | 'task_updated' | 'task_deleted';
    teamId?: string;
    count?: number;
    newAssignee?: string;
    message?: string;
    title?: string;
    byUser?: string;
}

export default function TeamDetailsPage() {
    const params = useParams();
    const teamId = params?.teamId as string;
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: session, status } = useSession();
    const { data: personalTeamId } = usePersonalWorkspace();

    const { data: team, isLoading: teamLoading } = useTeam(teamId);
    const { data: members, isLoading: membersLoading } = useTeamMembers(teamId);
    const isPersonal = team?.name === "Personal";
    const tasksQuery = useInfiniteTasks({ teamId, limit: 30 }, { enabled: !!teamId && !!session && !isPersonal });
    const { data: personalTasksData, isLoading: personalTasksLoading } = useTasks(teamId, {
        enabled: !!teamId && !!session && isPersonal,
    });

    const deleteTeamMutation = useDeleteTeam();
    const removeMemberMutation = useRemoveMember();
    const updateTeamMutation = useUpdateTeam();
    const updateTaskMutation = useUpdateTask();

    const [allocating, setAllocating] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState("");

    const [teamModalOpen, setTeamModalOpen] = useState(false);
    const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
    const [scratchpadOpen, setScratchpadOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [selectedMemberId, setSelectedMemberId] = useState<string>("");
    const [parentTaskId, setParentTaskId] = useState<string | undefined>(undefined);
    const [parentTeamId, setParentTeamId] = useState<string | undefined>(undefined);

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
    const [editingTeamEnableAll, setEditingTeamEnableAll] = useState(false);

    // Scroll state for navbar
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Socket.IO for real-time updates
    const socketRef = useRef<Socket | null>(null);
    useEffect(() => {
        if (!teamId) return;

        // Initialize socket
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || undefined;
        const socket = io(socketUrl, {
            addTrailingSlash: false,
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("TeamPage Socket connected:", socket.id);
            socket.emit("join-team", teamId);
        });

        socket.on("team-event", (data: any) => {
            console.log("TeamPage received event:", data.type);

            if (data.type === 'autoalloc_started') {
                const runner = data.byUser ? `User ${data.byUser}` : "A member";
                toast.info(`${runner} started allocation...`, { id: "alloc-start-toast" }); 
            } else if (data.type === 'allocation_completed') {
                toast.success(`Allocation complete! Assigned ${data.count} tasks.`);
                queryClient.invalidateQueries({ queryKey: ["tasks"] });
                queryClient.invalidateQueries({ queryKey: ["teamMembers", teamId] });
            } else if (data.type === 'task_reallocated') {
                toast.success(`Task reallocated`);
                queryClient.invalidateQueries({ queryKey: ["tasks"] });
            } else if (data.type === 'task_created') {
                toast.success(`New task: ${data.title}`);
                queryClient.invalidateQueries({ queryKey: ["tasks"] });
            } else if (data.type === 'task_deleted') {
                toast.success(`Task deleted`);
                queryClient.invalidateQueries({ queryKey: ["tasks"] });
            } else if (data.type === 'task_updated') {
                toast.success(`Task updated`);
                queryClient.invalidateQueries({ queryKey: ["tasks"] });
            } else if (data.type === 'SCRATCHPAD_UPDATED' || data.type === 'TEAM_UPDATED') {
                queryClient.invalidateQueries({ queryKey: ["team", teamId] });
            }
        });

        socket.on("allocation-update", (data: any) => {
            if (data.type === 'allocation_completed') {
                queryClient.invalidateQueries({ queryKey: ["tasks"] });
                queryClient.invalidateQueries({ queryKey: ["teamMembers", teamId] });
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [teamId, queryClient]);

    const tasks = useMemo(
        () => (isPersonal ? ((personalTasksData as Task[]) || []) : flattenInfiniteTasks(tasksQuery.data)),
        [isPersonal, personalTasksData, tasksQuery.data]
    );
    const unassignedTasks = useMemo(() => tasks.filter((t) => !t.assignedTo), [tasks]);
    const assignedTasks = useMemo(() => tasks.filter((t) => t.assignedTo), [tasks]);

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
        // Prevent deleting the personal workspace
        if (team.name === "Personal") {
            toast.error("Cannot delete your personal workspace");
            return;
        }

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

        // Prevent renaming the personal workspace
        if (team.name === "Personal" && editingTeamName !== "Personal") {
            toast.error("Cannot rename your personal workspace");
            return;
        }

        // Prevent renaming any team to "Personal"
        if (editingTeamName.trim().toLowerCase() === "personal" && team.name !== "Personal") {
            toast.error("The name 'Personal' is reserved for your personal workspace");
            return;
        }

        try {
            await updateTeamMutation.mutateAsync({
                id: teamId,
                name: editingTeamName,
                description: editingTeamDesc,
                enableAll: editingTeamEnableAll
            });
            queryClient.invalidateQueries({ queryKey: ["team", teamId] });
            toast.success("Team updated successfully");
            setTeamModalOpen(false);
        } catch (err) {
            console.error(err);
            toast.error("Failed to update team");
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
                    await api.post(`/allocator/${teamId}`);
                    queryClient.invalidateQueries({ queryKey: ["tasks"] });
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
        } catch (err) {
            const error = err as AxiosError<{ error: string }>;
            toast.error(error.response?.data?.error || "Failed to send invite");
        } finally {
            setInviteLoading(false);
        }
    };

    const openEditTeam = () => {
        setEditingTeamName(team.name);
        setEditingTeamDesc(team.desc || "");
        setEditingTeamEnableAll(team.enableAll || false);
        setTeamModalOpen(true);
    };

    const openEditTask = (task: Task) => {
        setSelectedTask(task);
    };

    const [mobileTab, setMobileTab] = useState<"workload" | "unassigned" | "assigned">("assigned");

    useEffect(() => {
        if (team && !teamLoading) {
            if (team.name === "Personal") {
                setMobileTab("unassigned");
            } else {
                setMobileTab("assigned");
            }
        }
    }, [team, teamLoading]);

    const shouldShowSkeleton =
        status === "loading" ||
        teamLoading ||
        membersLoading ||
        (!isPersonal && tasksQuery.isPending) ||
        (isPersonal && personalTasksLoading);
    if (!session && status !== "loading") return null;
    if (!team && !shouldShowSkeleton) return <div className="p-10 text-center bg-background text-zinc-500 font-sans">Team Not Found</div>;

    const isActualLeader = session?.user?.email === team?.leader?.email;
    const isLeader = Boolean(team && (isActualLeader || team.enableAll));
    const currentUserMemberId = (members as Member[])?.find((m: Member) => m.email === session?.user?.email)?.id;

    return (
        <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-background text-zinc-900 dark:text-zinc-300 font-sans pb-20 selection:bg-zinc-200 dark:selection:bg-zinc-800"
        >
            {shouldShowSkeleton ? (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
                    <div className="mb-8 space-y-3">
                        <p className="text-xs font-mono uppercase tracking-[0.3em] text-zinc-500">Workspace</p>
                        <h1 className="text-3xl font-bold text-zinc-100">
                            {team?.name || (teamId === personalTeamId ? "Personal Workspace" : "Team Workspace")}
                        </h1>
                        <p className="text-sm text-zinc-500 font-sans">
                            {teamId === personalTeamId 
                                ? "Loading your personal tasks and workspace." 
                                : "Loading team members, assignments, and workload analysis."}
                        </p>
                    </div>
                    <TeamWorkspaceSkeleton personal={teamId === personalTeamId || team?.name === "Personal"} />
                </div>
            ) : (
                <>
                    <TeamHeader
                        team={team}
                        isScrolled={isScrolled}
                        router={router}
                        isPersonal={isPersonal}
                        isLeader={isLeader}
                        isActualLeader={isActualLeader}
                        members={members as Member[]}
                        assignedTasks={assignedTasks}
                        openEditTeam={openEditTeam}
                        setInviteModalOpen={setInviteModalOpen}
                        setSelectedMemberId={setSelectedMemberId}
                        currentUserMemberId={currentUserMemberId}
                        setCreateTaskModalOpen={setCreateTaskModalOpen}
                        handleAllocate={handleAllocate}
                        allocating={allocating}
                        onOpenScratchpad={() => setScratchpadOpen(true)}
                        handleDeleteTeam={handleDeleteTeam}
                    />

                    <TeamScratchpad 
                        team={team} 
                        isOpen={scratchpadOpen} 
                        onClose={() => setScratchpadOpen(false)}
                        currentUserId={currentUserMemberId}
                    />

                    <MobileNavTabs isPersonal={isPersonal} mobileTab={mobileTab} setMobileTab={setMobileTab} onOpenScratchpad={() => setScratchpadOpen(true)} />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 mt-8">
                        {isPersonal ? (
                            <PersonalWorkspace
                                assignedTasks={assignedTasks}
                                currentUserMemberId={currentUserMemberId}
                                setSelectedMemberId={setSelectedMemberId}
                                setCreateTaskModalOpen={setCreateTaskModalOpen}
                                setParentTaskId={setParentTaskId}
                                setParentTeamId={setParentTeamId}
                                openEditTask={openEditTask}
                            />
                        ) : (
                            <>
                                {!isPersonal && (
                                    <div className={cn(mobileTab !== "workload" && "hidden lg:block")}>
                                        <WorkloadAnalysis
                                            members={members as Member[]}
                                            allTasks={tasks}
                                            tasksByMember={tasksByMember}
                                            isLeader={isLeader}
                                            isActualLeader={isActualLeader}
                                            setSelectedMemberId={setSelectedMemberId}
                                            setCreateTaskModalOpen={setCreateTaskModalOpen}
                                            handleRemoveMember={handleRemoveMember}
                                            removeMemberMutationPending={removeMemberMutation.isPending}
                                            isVisible={true}
                                        />
                                    </div>
                                )}

                                <TeamTaskBoard
                                    mobileTab={mobileTab}
                                    unassignedTasks={unassignedTasks}
                                    assignedTasks={assignedTasks}
                                    hasMoreTasks={!!tasksQuery.hasNextPage}
                                    isFetchingMoreTasks={tasksQuery.isFetchingNextPage}
                                    onLoadMoreTasks={() => {
                                        void tasksQuery.fetchNextPage();
                                    }}
                                    members={members as Member[]}
                                    tasksByMember={tasksByMember}
                                    isLeader={isLeader}
                                    openEditTask={openEditTask}
                                />
                            </>
                        )}
                    </div>
                </>
            )}

            <InviteModal
                isOpen={inviteModalOpen}
                onClose={() => setInviteModalOpen(false)}
                inviteLink={inviteLink}
                inviteEmail={inviteEmail}
                setInviteEmail={setInviteEmail}
                handleInvite={handleInvite}
                inviteLoading={inviteLoading}
            />

            <CreateTaskModal
                isOpen={createTaskModalOpen}
                onClose={() => {
                    setCreateTaskModalOpen(false);
                    setSelectedMemberId("");
                    setParentTaskId(undefined);
                    setParentTeamId(undefined);
                }}
                initialTeamId={parentTeamId || teamId}
                initialAssignedToId={selectedMemberId}
                initialParentId={parentTaskId}
                isPersonalWorkspace={isPersonal}
                currentUserId={currentUserMemberId}
                onTaskCreated={() => {
                    queryClient.invalidateQueries({ queryKey: ["tasks"] });
                }}
            />

            <EditTeamModal
                isOpen={teamModalOpen}
                onClose={() => setTeamModalOpen(false)}
                editingTeamName={editingTeamName}
                setEditingTeamName={setEditingTeamName}
                editingTeamDesc={editingTeamDesc}
                setEditingTeamDesc={setEditingTeamDesc}
                editingTeamEnableAll={editingTeamEnableAll}
                setEditingTeamEnableAll={setEditingTeamEnableAll}
                isActualLeader={isActualLeader}
                handleSaveTeam={handleSaveTeam}
                isPending={updateTeamMutation.isPending}
            />

            {!shouldShowSkeleton && (
                <TaskDetailDrawer
                    selectedTask={selectedTask}
                    setSelectedTask={setSelectedTask}
                    updateTaskMutation={updateTaskMutation}
                    refreshTasks={() => {
                        queryClient.invalidateQueries({ queryKey: ["tasks"] });
                    }}
                    isLeader={isLeader}
                    teamName={team?.name}
                    currentUserId={currentUserMemberId}
                    members={members as Member[]}
                />
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
        </motion.main>
    );
}
