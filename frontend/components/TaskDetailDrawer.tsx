import { useState, useEffect } from "react";
import { Pause, Play, X, Calendar, Users, Flag, Edit2, Save, Loader2, Trash2, CheckCircle2 } from "lucide-react"
import cn from "clsx"
import { motion, AnimatePresence } from "framer-motion";
import { Task, useDeleteTask } from "@/hooks/useTasks";
import ConfirmModal from "./ConfirmModal";
import { UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";

interface Member {
    id: string;
    name: string;
    email: string;
}

interface TaskDetailDrawerProps {
    selectedTask: Task | null;
    setSelectedTask: (task: Task | null) => void;
    updateTaskMutation: UseMutationResult<unknown, Error, { id: string;[key: string]: unknown }, unknown>; // Typed for usage
    refreshTasks: () => void;
    isLeader?: boolean;
    members?: Member[];
    teamName?: string; // Optional team name to override task.team.name
}

export default function TaskDetailDrawer({ selectedTask, setSelectedTask, updateTaskMutation, refreshTasks, isLeader = false, members = [], teamName }: TaskDetailDrawerProps) {
    const deleteTaskMutation = useDeleteTask();

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

    // HCI: Keyboard shortcut to close drawer
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

        // Close drawer immediately for instant feedback (optimistic UI)
        setSelectedTask(null);
        toast.success("Task updated successfully");

        try {
            await updateTaskMutation.mutateAsync({
                id: selectedTask.id,
                title: editForm.title,
                description: editForm.description,
                deadline: editForm.deadline || null, // Handle clear date
                priority: editForm.priority,
                requiredSkill: editForm.requiredSkill || null,
                assignedToId: editForm.assignedToId || null
            });
            refreshTasks();
        } catch (e) {
            console.error("Failed to update task details", e);
            toast.error("Failed to update task");
        }
    };

    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    const handleDeleteTask = async () => {
        if (!selectedTask) return;
        setConfirmDeleteOpen(true);
    };

    const performDelete = async () => {
        if (!selectedTask) return;

        // Close drawer and modal immediately for instant feedback (optimistic UI)
        setConfirmDeleteOpen(false);
        setSelectedTask(null);
        toast.success("Task deleted successfully");

        try {
            await deleteTaskMutation.mutateAsync(selectedTask.id);
            refreshTasks();
        } catch (e) {
            console.error("Failed to delete task", e);
            toast.error("Failed to delete task");
        }
    };

    if (!selectedTask) return null;

    // Normalize data fields since we might get slightly different shapes from different endpoints
    // Use provided teamName prop if available, otherwise fall back to task.team.name
    const taskTeamName = teamName || selectedTask.team?.name || "Unassigned"; // handle complex nested or flat relations
    const isPersonal = taskTeamName === 'Personal';

    const taskDescription = selectedTask.desc || selectedTask.description || "No description provided for this task.";
    const taskDeadline = selectedTask.deadline;

    return (
        <AnimatePresence>
            {selectedTask && (
                <div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
                        onClick={() => setSelectedTask(null)}
                    >
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="w-full max-w-md bg-card h-full shadow-2xl p-6 overflow-y-auto border-l border-zinc-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header with Close Button */}
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-900">
                                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Task Details</h2>
                                <button
                                    onClick={() => setSelectedTask(null)}
                                    className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                                    aria-label="Close Drawer"
                                    title="Close (Esc)"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Action Buttons - Prominent at Top */}
                            {(isPersonal || isLeader) && (
                                <div className="mb-6 flex gap-2">
                                    {isEditing ? (
                                        <>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleSaveChanges}
                                                disabled={updateTaskMutation.isPending}
                                                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {updateTaskMutation.isPending ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-4 h-4" />
                                                        Save Changes
                                                    </>
                                                )}
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setIsEditing(false)}
                                                className="px-4 py-2.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-medium rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </motion.button>
                                        </>
                                    ) : (
                                        <>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setIsEditing(true)}
                                                className="flex-1 py-2.5 px-4 bg-zinc-900 dark:bg-white hover:bg-zinc-700 dark:hover:bg-zinc-100 text-white dark:text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                Edit Task
                                            </motion.button>
                                            {isLeader && (
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={handleDeleteTask}
                                                    disabled={deleteTaskMutation.isPending}
                                                    className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                >
                                                    {deleteTaskMutation.isPending ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Trash2 className="w-4 h-4" />
                                                            Delete
                                                        </>
                                                    )}
                                                </motion.button>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="space-y-8">
                                <div>
                                    {isEditing ? (
                                        <div className="space-y-4 mb-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-zinc-500 uppercase">Title</label>
                                                <input
                                                    type="text"
                                                    value={editForm.title}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-zinc-700"
                                                    placeholder="Task Title"
                                                />
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="space-y-2 flex-1">
                                                    <label className="text-xs font-bold text-zinc-500 uppercase">Priority</label>
                                                    <select
                                                        value={editForm.priority}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value }))}
                                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-zinc-700 appearance-none"
                                                    >
                                                        <option value="Low">Low</option>
                                                        <option value="Medium">Medium</option>
                                                        <option value="High">High</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2 flex-1">
                                                    <label className="text-xs font-bold text-zinc-500 uppercase">Status (Read-only)</label>
                                                    <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-zinc-500 cursor-not-allowed">
                                                        {selectedTask.status}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={cn("px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border",
                                                selectedTask.priority === 'High' ? "bg-red-950/20 text-red-400 border-red-900/50" :
                                                    selectedTask.priority === 'Medium' ? "bg-amber-950/20 text-amber-400 border-amber-900/50" :
                                                        "bg-green-950/20 text-green-400 border-green-900/50"
                                            )}>
                                                {selectedTask.priority || "Normal"} Priority
                                            </span>
                                            <span className={cn("px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border",
                                                selectedTask.status === 'active' || selectedTask.status === 'in-progress' || selectedTask.status === 'to-do' || selectedTask.status === 'pending' ? "bg-blue-950/20 text-blue-400 border-blue-900/50" : "bg-zinc-900 text-zinc-500 border-zinc-800"
                                            )}>
                                                {selectedTask.status === 'pending' || selectedTask.status === 'to-do' ? 'To Do' :
                                                    selectedTask.status === 'active' || selectedTask.status === 'in-progress' ? 'In Progress' :
                                                        selectedTask.status.replace('-', ' ')}
                                            </span>
                                        </div>
                                    )}

                                    {!isEditing && <h3 className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight break-words">{selectedTask.title}</h3>}
                                </div>

                                <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-zinc-500 flex items-center gap-2"><Users className="w-4 h-4" /> Team</span>
                                        <span className="font-medium text-zinc-200">{taskTeamName}</span>
                                    </div>

                                    {/* Assigned To - editable for leaders */}
                                    {isLeader && !isPersonal && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-zinc-500 flex items-center gap-2"><Users className="w-4 h-4" /> Assigned To</span>
                                            {isEditing ? (
                                                <select
                                                    value={editForm.assignedToId}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, assignedToId: e.target.value }))}
                                                    className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-zinc-700"
                                                >
                                                    <option value="">-- Unassigned --</option>
                                                    {members.map((m) => (
                                                        <option key={m.id} value={m.id}>{m.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                                    {selectedTask.assignedTo?.name || "Unassigned"}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-zinc-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Due Date</span>
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                value={editForm.deadline}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, deadline: e.target.value }))}
                                                className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-zinc-700 [color-scheme:dark]"
                                            />
                                        ) : (
                                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                                {taskDeadline ? new Date(taskDeadline).toLocaleDateString() : "No Date"}
                                            </span>
                                        )}
                                    </div>

                                    {/* Required Skill - always show in edit mode or if it exists */}
                                    {(isEditing || selectedTask.requiredSkill) && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-zinc-500 flex items-center gap-2"><Flag className="w-4 h-4" /> Skill</span>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editForm.requiredSkill}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, requiredSkill: e.target.value }))}
                                                    placeholder="e.g. React, Python"
                                                    className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-zinc-700 w-48"
                                                />
                                            ) : (
                                                <span className="font-medium text-zinc-800 dark:text-zinc-200">{selectedTask.requiredSkill}</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wider flex items-center justify-between">
                                        Description
                                    </h4>
                                    {isEditing ? (
                                        <textarea
                                            value={editForm.description}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                            className="w-full h-32 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-zinc-700 resize-none"
                                            placeholder="Add a description..."
                                        />
                                    ) : (
                                        <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-200 dark:border-zinc-800 min-h-[100px] whitespace-pre-wrap">
                                            {taskDescription}
                                        </div>
                                    )}
                                </div>

                                <div className="pt-6 mt-auto flex gap-3 border-t border-zinc-900">
                                    {/* Personal Workspace Actions: Toggle To-Do <-> Completed */}
                                    {/* Personal Workspace Actions: Toggle To-Do <-> Completed */}
                                    {isPersonal ? (
                                        <>
                                            {selectedTask.status === 'completed' ? (
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => handleStatusUpdate('pending')}
                                                    disabled={updateTaskMutation.isPending}
                                                    className="flex-1 py-3 bg-zinc-100 text-black font-bold rounded-xl hover:bg-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {updateTaskMutation.isPending ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Updating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Edit2 className="w-4 h-4" />
                                                            Mark as To Do
                                                        </>
                                                    )}
                                                </motion.button>
                                            ) : (
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => handleStatusUpdate('completed')}
                                                    disabled={updateTaskMutation.isPending}
                                                    className="flex-1 py-3 bg-zinc-900 text-white dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-800 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {updateTaskMutation.isPending ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Completing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            Complete Task
                                                        </>
                                                    )}
                                                </motion.button>
                                            )}
                                        </>
                                    ) : (
                                        /* Team Workspace Actions: To Do -> In Progress -> Completed */
                                        <>
                                            {(selectedTask.status === 'to-do' || selectedTask.status === 'pending') && (
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => handleStatusUpdate('active')}
                                                    disabled={updateTaskMutation.isPending}
                                                    className="flex-1 py-3 bg-zinc-100 text-black font-bold rounded-xl hover:bg-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {updateTaskMutation.isPending ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Updating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Play className="w-4 h-4" />
                                                            Start Task
                                                        </>
                                                    )}
                                                </motion.button>
                                            )}
                                            {(selectedTask.status === 'active' || selectedTask.status === 'in-progress') && (
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => handleStatusUpdate('pending')}
                                                    disabled={updateTaskMutation.isPending}
                                                    className="flex-1 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {updateTaskMutation.isPending ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Updating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Pause className="w-4 h-4" />
                                                            Pause Task
                                                        </>
                                                    )}
                                                </motion.button>
                                            )}
                                            {selectedTask.status !== 'completed' && (
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => handleStatusUpdate('completed')}
                                                    disabled={updateTaskMutation.isPending}
                                                    className={cn(
                                                        "px-6 py-3 bg-zinc-900 text-white dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                                                        (selectedTask.status === 'completed') && "opacity-50 cursor-not-allowed"
                                                    )}
                                                >
                                                    Complete
                                                </motion.button>
                                            )}
                                            {selectedTask.status === 'completed' && (
                                                <div className="flex-1 py-3 flex items-center justify-center text-zinc-500 font-medium">
                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                    Completed
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                    <ConfirmModal
                        isOpen={confirmDeleteOpen}
                        onClose={() => setConfirmDeleteOpen(false)}
                        onConfirm={performDelete}
                        title="Delete Task"
                        description="Are you sure you want to delete this task? This action cannot be undone."
                        variant="danger"
                        confirmText="Delete"
                        loading={deleteTaskMutation.isPending}
                    />
                </div>
            )}
        </AnimatePresence>
    )
}