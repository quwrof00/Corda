"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTeam, useTeamMembers, useDeleteTeam, useRemoveMember, useUpdateTeam } from "@/hooks/useTeams";
import { useTasks, useUpdateTask, Task } from "@/hooks/useTasks";
import { api } from "@/lib/api";
import { AxiosError } from "axios";
import { useSession } from "next-auth/react";
import { useState, useMemo, useEffect } from "react";
import { Loader2 } from "lucide-react";
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
    const updateTeamMutation = useUpdateTeam();
    const updateTaskMutation = useUpdateTask();

    const [allocating, setAllocating] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState("");

    const [teamModalOpen, setTeamModalOpen] = useState(false);
    const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
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

    const isActualLeader = session?.user?.email === team.leader?.email;
    const isLeader = isActualLeader || team.enableAll;
    const isPersonal = team.name === "Personal";
    const currentUserMemberId = (members as Member[])?.find((m: Member) => m.email === session?.user?.email)?.id;

    return (
        <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-background text-zinc-900 dark:text-zinc-300 font-sans pb-20 selection:bg-zinc-200 dark:selection:bg-zinc-800"
        >
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
                handleDeleteTeam={handleDeleteTeam}
            />

            <MobileNavTabs isPersonal={isPersonal} mobileTab={mobileTab} setMobileTab={setMobileTab} />

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
                                    tasksByMember={tasksByMember}
                                    totalTasksCount={(tasks as Task[])?.length || 0}
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
                            members={members as Member[]}
                            tasksByMember={tasksByMember}
                            isLeader={isLeader}
                            openEditTask={openEditTask}
                        />
                    </>
                )}
            </div>

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
                    queryClient.invalidateQueries({ queryKey: ["tasks", teamId] });
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

            <TaskDetailDrawer
                selectedTask={selectedTask}
                setSelectedTask={setSelectedTask}
                updateTaskMutation={updateTaskMutation}
                refreshTasks={() => queryClient.invalidateQueries({ queryKey: ["tasks", teamId] })}
                isLeader={isLeader}
                teamName={team?.name}
                currentUserId={currentUserMemberId}
                members={members as Member[]}
            />

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
