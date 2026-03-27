import { LoadingBars } from "@/components/shared/LoadingBars";
import { useState, useEffect } from "react";
import { Pause, Play, X, Calendar, Users, Edit2, Save, Trash2, CheckCircle2, Clock, Plus, ChevronRight, Wrench, Ban } from "lucide-react";
import cn from "clsx"
import { motion, AnimatePresence } from "framer-motion";
import { Task, useDeleteTask } from "@/hooks/useTasks";
import ConfirmModal from "./ConfirmModal";
import { UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";

interface Member {
    id: string;
    name: string;
}

interface TaskDetailDrawerProps {
    selectedTask: Task | null;
    setSelectedTask: (task: Task | null) => void;
    updateTaskMutation: UseMutationResult<unknown, Error, { id: string;[key: string]: unknown }, unknown>;
    refreshTasks: () => void;
    isLeader?: boolean;
    teamName?: string;
    currentUserId?: string;
    onCreateSubtask?: (parentId: string, teamId: string) => void;
    members?: Member[];
}

export default function TaskDetailDrawer({ selectedTask, setSelectedTask, updateTaskMutation, refreshTasks, isLeader = false, teamName, currentUserId, onCreateSubtask, members }: TaskDetailDrawerProps) {
    const deleteTaskMutation = useDeleteTask();
    const [actionPending, setActionPending] = useState<"status" | "save" | "delete" | "recurrence" | null>(null);

    const handleStatusUpdate = async (status: string) => {
        if (!selectedTask) return;
        const taskToUpdate = selectedTask;

        // Optimistic UI: Close immediately
        setSelectedTask(null);

        try {
            setActionPending("status");
            await updateTaskMutation.mutateAsync({
                id: taskToUpdate.id,
                status: status
            });
            refreshTasks();
        } catch (e) {
            console.error("Failed to update task", e);
            toast.error("Failed to update status");
            setSelectedTask(taskToUpdate);
        } finally {
            setActionPending(null);
        }
    };

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        title: "",
        description: "",
        deadline: "",
        priority: "Medium",
        requiredSkill: "",
        assignedToId: ""
    });

    useEffect(() => {
        if (selectedTask) {
            setEditForm({
                title: selectedTask.title || "",
                description: selectedTask.desc || selectedTask.description || "",
                deadline: selectedTask.deadline ? new Date(selectedTask.deadline).toISOString().split('T')[0] : "",
                priority: selectedTask.priority || "Medium",
                requiredSkill: selectedTask.requiredSkill || "",
                assignedToId: selectedTask.assignedToId || selectedTask.assignedTo?.id || ""
            });
        }
        setIsEditing(false);
    }, [selectedTask]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selectedTask) {
                if (isEditing) {
                    setIsEditing(false);
                } else {
                    setSelectedTask(null);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedTask, isEditing, setSelectedTask]);

    const handleSaveChanges = async () => {
        if (!selectedTask) return;
        const taskToRestore = selectedTask;

        // Optimistic UI: Close immediately
        setSelectedTask(null);

        try {
            setActionPending("save");
            await updateTaskMutation.mutateAsync({
                id: selectedTask.id,
                title: editForm.title,
                description: editForm.description,
                deadline: editForm.deadline ? new Date(`${editForm.deadline}T23:59:59`).toISOString() : null,
                priority: editForm.priority,
                requiredSkill: editForm.requiredSkill || null,
                assignedToId: editForm.assignedToId || null
            });
            toast.success("Task updated successfully");
            refreshTasks();
        } catch (e) {
            console.error("Failed to update task details", e);
            toast.error("Failed to update task");
            setSelectedTask(taskToRestore);
        } finally {
            setActionPending(null);
        }
    };

    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [deleteRecurring, setDeleteRecurring] = useState(false);

    const handleDeleteTask = async () => {
        if (!selectedTask) return;
        setDeleteRecurring(false);
        setConfirmDeleteOpen(true);
    };

    const performDelete = async () => {
        if (!selectedTask) return;
        const taskToDelete = selectedTask;
        setConfirmDeleteOpen(false);
        // Optimistic UI: Close immediately
        setSelectedTask(null);

        try {
            setActionPending("delete");
            await deleteTaskMutation.mutateAsync({ id: taskToDelete.id, deleteRecurring });
            toast.success("Task deleted successfully");
            refreshTasks();
        } catch (e) {
            console.error("Failed to delete task", e);
            toast.error("Failed to delete task");
            setSelectedTask(taskToDelete);
        } finally {
            setActionPending(null);
        }
    };

    const handleEndRecurrence = async () => {
        if (!selectedTask || !selectedTask.recurrenceId) return;
        const taskToRestore = selectedTask;
        
        // Optimistic UI: Close immediately
        setSelectedTask(null);

        try {
            setActionPending("recurrence");
            await updateTaskMutation.mutateAsync({
                id: selectedTask.id,
                endRecurrence: true
            });
            toast.success("Recurrence ended successfully");
            refreshTasks();
        } catch (e) {
            console.error("Failed to end recurrence", e);
            toast.error("Failed to end recurrence");
            setSelectedTask(taskToRestore);
        } finally {
            setActionPending(null);
        }
    };

    if (!selectedTask) return null;

    const taskTeamName = teamName || selectedTask.team?.name || "Unassigned";
    const isPersonal = taskTeamName === 'Personal';

    const isAssignee = currentUserId && (selectedTask.assignedToId === currentUserId || selectedTask.assignedTo?.id === currentUserId);
    const canDelete = isLeader || isPersonal || isAssignee;
    const canEditDetails = isLeader || isPersonal || isAssignee;

    const taskDescription = selectedTask.desc || selectedTask.description || "No description provided for this task.";
    const taskDeadline = selectedTask.deadline;

    // Subtasks logic
    const subtasks = selectedTask.children || [];

    return (
        <>
            <AnimatePresence>
                {selectedTask && (
                    <div key={selectedTask.id} className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTask(null)}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 z-[-1]"
                        />

                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 350 }}
                            className="w-full max-w-md bg-background h-full shadow-2xl flex flex-col border-l border-[var(--border-time)]" // Use dark bg as per image
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-bold text-white">Task Details</h2>
                                    <button
                                        onClick={() => setSelectedTask(null)}
                                        className="text-zinc-500 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Top Actions - Matches Image */}
                                {!isEditing && (canEditDetails || canDelete) && (
                                    <div className="mb-6 w-full">
                                        <div className="flex flex-wrap gap-3 mb-3">
                                            {canEditDetails && (
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setIsEditing(true)}
                                                    className="flex-1 py-2.5 bg-[var(--accent-time)] text-[var(--accent-time-text)] font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                    Edit Task
                                                </motion.button>
                                            )}

                                            {canDelete && (
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={handleDeleteTask}
                                                    disabled={actionPending !== null}
                                                    className="px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-red-700 transition-colors disabled:opacity-50"
                                                >
                                                    {actionPending === "delete" ? <LoadingBars className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                                                    Delete
                                                </motion.button>
                                            )}
                                        </div>
                                        {canEditDetails && selectedTask.recurrenceId && (
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleEndRecurrence}
                                                disabled={actionPending !== null}
                                                className="px-4 py-2.5 bg-zinc-800 text-amber-500 font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors disabled:opacity-50 w-full"
                                                title="Stop repeating this task"
                                            >
                                                {actionPending === "recurrence" ? <LoadingBars className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                                End Recurrence
                                            </motion.button>
                                        )}
                                    </div>
                                )}

                                {/* Edit Mode Custom Header */}
                                {isEditing && (
                                    <div className="flex gap-3 mb-6">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleSaveChanges}
                                            disabled={actionPending !== null}
                                            className="flex-1 py-2.5 bg-emerald-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors"
                                        >
                                            {actionPending === "save" ? <LoadingBars className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                            Save
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2.5 bg-zinc-800 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors"
                                        >
                                            Cancel
                                        </motion.button>
                                    </div>
                                )}

                                {isEditing ? (
                                    <div className="space-y-4 mb-6">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-zinc-500 uppercase">Title</label>
                                            <input
                                                type="text"
                                                value={editForm.title}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-zinc-700 font-bold text-lg"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-zinc-500 uppercase">Required Skill</label>
                                            <input
                                                type="text"
                                                value={editForm.requiredSkill}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, requiredSkill: e.target.value }))}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-zinc-700 text-sm"
                                                placeholder="e.g. Frontend, React, Backend"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-zinc-500 uppercase">Priority</label>
                                                <select
                                                    value={editForm.priority}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value }))}
                                                    disabled={!isLeader}
                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-zinc-700 disabled:opacity-50"
                                                >
                                                    <option value="Low">Low</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="High">High</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-zinc-500 uppercase">Due Date</label>
                                                <input
                                                    type="date"
                                                    value={editForm.deadline}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, deadline: e.target.value }))}
                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-zinc-700 [color-scheme:dark]"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-zinc-500 uppercase">Description</label>
                                            <textarea
                                                value={editForm.description}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                                className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-zinc-700 resize-none text-sm leading-relaxed"
                                            />
                                        </div>
                                        {members && members.length > 0 && (
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-zinc-500 uppercase">Assign To</label>
                                                <select
                                                    value={editForm.assignedToId}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, assignedToId: e.target.value }))}
                                                    disabled={!isLeader}
                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-zinc-700 disabled:opacity-50"
                                                >
                                                    <option value="">Unassigned</option>
                                                    {members.map(member => (
                                                        <option key={member.id} value={member.id}>{member.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        {/* Badges - Matches Image */}
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                                                selectedTask.priority === 'High' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                    selectedTask.priority === 'Medium' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                        "bg-green-500/10 text-green-500 border-green-500/20"
                                            )}>
                                                {selectedTask.priority} Priority
                                            </span>
                                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-blue-500/10 text-blue-500 border-blue-500/20">
                                                {selectedTask.status === 'pending' || selectedTask.status === 'to-do' ? 'To Do' :
                                                    selectedTask.status === 'active' || selectedTask.status === 'in-progress' ? 'In Progress' :
                                                        selectedTask.status.replace('-', ' ')}
                                            </span>
                                        </div>

                                        {/* Title - Matches Image */}
                                        <h1 className="text-2xl font-bold text-white leading-tight mb-8">
                                            {selectedTask.title}
                                        </h1>

                                        {/* Info Card - Matches Image Style */}
                                        <div className="bg-[var(--header-time)] border border-[var(--border-time)] rounded-2xl p-4 mb-8 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-zinc-400">
                                                    <Users className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Team</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-white">{taskTeamName}</div>
                                                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Member</div>
                                                </div>
                                            </div>
                                            <div className="w-full h-px bg-white/5" />
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-zinc-400">
                                                    <Calendar className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Due Date</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-white">
                                                        {taskDeadline ? new Date(taskDeadline).toLocaleDateString() : "No Date"}
                                                    </div>
                                                    {!taskDeadline && <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Unassigned</div>}
                                                </div>
                                            </div>
                                            {/* Added Assignee row for completeness even if not in crop */}
                                            <div className="w-full h-px bg-white/5" />
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-zinc-400">
                                                    <Wrench className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Required Skill</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-white">{selectedTask.requiredSkill || "None"}</div>
                                                </div>
                                            </div>
                                            <div className="w-full h-px bg-white/5" />
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-zinc-400">
                                                    <Users className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Assignee</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-white">{selectedTask.assignedTo?.name || "Unassigned"}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description Section - Matches Image */}
                                        <div className="mb-8">
                                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Description</h3>
                                            <div className="bg-[var(--header-time)] border border-[var(--border-time)] rounded-2xl p-5 min-h-[100px]">
                                                <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
                                                    {taskDescription}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Subtasks Section */}
                                        <div className="mb-8">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Subtasks</h3>
                                                {onCreateSubtask && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTask(null);
                                                            onCreateSubtask(selectedTask.id, selectedTask.teamId || "");
                                                        }}
                                                        className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider flex items-center gap-1 transition-colors"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        Add Subtask
                                                    </button>
                                                )}
                                            </div>
                                            {subtasks.length > 0 ? (
                                                <div className="space-y-2">
                                                    {subtasks.map(subtask => (
                                                        <div key={subtask.id} className="flex items-center gap-3 p-3 bg-[var(--header-time)] border border-[var(--border-time)] rounded-xl hover:bg-zinc-900 cursor-pointer" onClick={() => setSelectedTask(subtask)}>
                                                            <div className={cn(
                                                                "w-1 h-8 rounded-full flex-shrink-0",
                                                                subtask.status === 'completed' ? "bg-emerald-500" :
                                                                    (subtask.status === 'active' || subtask.status === 'in-progress') ? "bg-blue-500" :
                                                                        "bg-zinc-700"
                                                            )} />
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className={cn("text-sm font-medium truncate", subtask.status === 'completed' ? "text-zinc-600 line-through" : "text-zinc-200")}>{subtask.title}</h4>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className={cn("text-[10px] uppercase font-bold tracking-wider",
                                                                        subtask.priority === 'High' ? "text-red-500" :
                                                                            subtask.priority === 'Medium' ? "text-amber-500" :
                                                                                "text-zinc-500"
                                                                    )}>{subtask.priority}</span>
                                                                </div>
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-zinc-600" />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-zinc-600 italic py-2">No subtasks found.</div>
                                            )}
                                        </div>

                                    </>
                                )}
                            </div>

                            {/* Bottom Actions - Matches Image */}
                            {!isEditing && (
                                <div className="p-6 pt-0 mt-auto bg-gradient-to-t from-background to-transparent">
                                    {isPersonal ? (
                                        selectedTask.status === 'completed' ? (
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleStatusUpdate('pending')}
                                                disabled={actionPending !== null}
                                                className="w-full py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                                            >
                                                {actionPending === "status" ? <LoadingBars className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                                Mark as To Do
                                            </motion.button>
                                        ) : (
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleStatusUpdate('completed')}
                                                disabled={actionPending !== null}
                                                className="w-full py-3.5 bg-[var(--accent-time)] text-[var(--accent-time-text)] font-bold rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                                            >
                                                {actionPending === "status" ? <LoadingBars className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                                Complete Task
                                            </motion.button>
                                        )
                                    ) : (
                                        /* Team Actions Logic */
                                        (selectedTask.status === 'to-do' || selectedTask.status === 'pending') ? (
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleStatusUpdate('active')}
                                                disabled={actionPending !== null}
                                                className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-50"
                                            >
                                                {actionPending === "status" ? <LoadingBars className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                                Start Task
                                            </motion.button>
                                        ) : (selectedTask.status === 'active' || selectedTask.status === 'in-progress') ? (
                                            <div className="flex gap-3">
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => handleStatusUpdate('pending')}
                                                    disabled={actionPending !== null}
                                                    className="flex-1 py-3.5 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {actionPending === "status" ? <LoadingBars className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                                                    Pause
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => handleStatusUpdate('completed')}
                                                    disabled={actionPending !== null}
                                                    className="flex-[1.5] py-3.5 bg-[var(--accent-time)] text-[var(--accent-time-text)] font-bold rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                                                >
                                                    {actionPending === "status" ? <LoadingBars className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                                    Done
                                                </motion.button>
                                            </div>
                                        ) : (
                                            <button disabled className="w-full py-3.5 bg-zinc-800/50 text-zinc-500 font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                                                <CheckCircle2 className="w-5 h-5" />
                                                Completed
                                            </button>
                                        )
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <ConfirmModal
                isOpen={confirmDeleteOpen}
                onClose={() => setConfirmDeleteOpen(false)}
                onConfirm={performDelete}
                title="Delete Task"
                description={
                    selectedTask?.recurrenceId && deleteRecurring
                        ? "Are you sure you want to delete this task and ALL future tasks in this recurring series? This action cannot be undone."
                        : "Are you sure you want to delete this task? This action cannot be undone."
                }
                variant="danger"
                confirmText={selectedTask?.recurrenceId && deleteRecurring ? "Delete Series" : "Delete"}
                loading={actionPending === "delete"}
            >
                {selectedTask?.recurrenceId && (
                    <label className="flex items-start gap-3 cursor-pointer p-4 border border-red-500/20 bg-red-500/5 rounded-xl transition-colors hover:bg-red-500/10">
                        <input
                            type="checkbox"
                            checked={deleteRecurring}
                            onChange={(e) => setDeleteRecurring(e.target.checked)}
                            className="w-4 h-4 mt-0.5 rounded border-red-500/50 bg-black/20 text-red-600 focus:ring-red-600 focus:ring-offset-zinc-950 accent-red-600 cursor-pointer"
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-red-400">Delete all recurring instances</span>
                            <span className="text-xs text-red-500/70 mt-0.5">This will delete this task and all future instances in this series.</span>
                        </div>
                    </label>
                )}
            </ConfirmModal>
            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </>
    );
}
