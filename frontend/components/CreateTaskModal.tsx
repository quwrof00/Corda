import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTeams } from "@/hooks/useTeams";
import { useCreateTask } from "@/hooks/useTasks";
import { Loader2, ListTodo, X } from "lucide-react";
import { toast } from "sonner";

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTaskCreated?: () => void;
    initialTeamId?: string;
    initialAssignedToId?: string;
    isPersonalWorkspace?: boolean;
    currentUserId?: string;
}

export default function CreateTaskModal({
    isOpen,
    onClose,
    onTaskCreated,
    initialTeamId,
    initialAssignedToId,
    isPersonalWorkspace,
    currentUserId
}: CreateTaskModalProps) {
    const { data: teams } = useTeams();
    const createTaskMutation = useCreateTask();

    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [deadline, setDeadline] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [requiredSkill, setRequiredSkill] = useState("");
    const [teamId, setTeamId] = useState(initialTeamId || "");
    const [assignedToId, setAssignedToId] = useState(initialAssignedToId || "");
    const [assignToMe, setAssignToMe] = useState(false);

    // Reset and initialize state when modal opens
    useEffect(() => {
        if (isOpen) {
            setTitle("");
            setDesc("");
            // Set default deadline to today's date
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
            setDeadline(formattedDate);
            setPriority("Medium");
            setRequiredSkill("");

            setTeamId(initialTeamId || "");
            setAssignedToId(initialAssignedToId || "");

            // Logic for "Assign to me":
            // 1. Personal workspace implicitly assigns to me
            // 2. If the initial assignee is the current user, check it
            const shouldAssignToMe = isPersonalWorkspace || (!!currentUserId && initialAssignedToId === currentUserId);
            setAssignToMe(shouldAssignToMe);
        }
    }, [isOpen, initialTeamId, initialAssignedToId, isPersonalWorkspace, currentUserId]);

    // Auto-select "Personal" team if no team is pre-selected
    useEffect(() => {
        if (isOpen && !teamId && !initialTeamId && teams) {
            const personalTeam = teams.find((t: { name: string }) => t.name === "Personal");
            if (personalTeam) {
                setTeamId(personalTeam.id);
            }
        }
    }, [isOpen, teamId, initialTeamId, teams]);

    // HCI: Auto-focus first input and Esc to close
    const titleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && titleInputRef.current) {
            // Small delay to ensure modal animation completes
            setTimeout(() => titleInputRef.current?.focus(), 100);
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Handle team selection changes to enforce Personal validation
    useEffect(() => {
        if (!teams || !teamId) return;

        const selectedTeam = teams.find((t: { id: string; name: string }) => t.id === teamId);
        const isPersonalTeam = selectedTeam?.name === "Personal";

        if (isPersonalTeam) {
            setAssignToMe(true);
            if (currentUserId) setAssignedToId(currentUserId);
        } else if (teamId !== initialTeamId) {
            // Only reset if we've explicitly changed the team and it's not the initial one
            setAssignToMe(false);
            setAssignedToId("");
        }
    }, [teamId, teams, initialTeamId, currentUserId]);

    if (!isOpen) return null;

    const selectedTeam = teams?.find((t: { id: string; name: string }) => t.id === teamId);
    const isPersonalTeam = selectedTeam?.name === "Personal";
    const isCheckboxDisabled = isPersonalWorkspace || isPersonalTeam || !currentUserId;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Determine final assignedToId.
            // If checking box, force currentUserId if it exists.
            let finalAssignedToId = assignedToId;
            if (assignToMe && currentUserId) {
                finalAssignedToId = currentUserId;
            }

            await createTaskMutation.mutateAsync({
                title,
                description: desc,
                deadline: deadline ? new Date(deadline).toISOString() : new Date().toISOString(), // Use ISO string for consistency. Fallback to today.
                priority,
                requiredSkill,
                teamId,
                assignedToId: finalAssignedToId || undefined,
            });

            if (onTaskCreated) {
                onTaskCreated();
            }
            onClose();
            toast.success("Task created successfully!");

            // Reset form
            setTitle("");
            setDesc("");
            // Reset to today's date
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0];
            setDeadline(formattedDate);
            setPriority("Medium");
            setRequiredSkill("");
            setTeamId(initialTeamId || "");
            setAssignedToId(initialAssignedToId || "");
            setAssignToMe(isPersonalWorkspace || false);
        } catch (err) {
            console.error(err);
            toast.error("Failed to create task.");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", duration: 0.3 }}
                        className="w-full max-w-4xl bg-card border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
                                    <ListTodo className="w-5 h-5 text-white dark:text-black" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">New Task</h1>
                                    <p className="text-zinc-500 text-xs">
                                        {isPersonalWorkspace ? "Add to your personal list" : "Create a task for your team"}
                                    </p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                title="Close (Esc)"
                                type="button"
                            >
                                <X className="w-5 h-5" />
                            </motion.button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            {/* 2-Column Compact Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Left Column */}
                                <div className="space-y-4">
                                    {/* Title */}
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                                            Task Title *
                                        </label>
                                        <input
                                            ref={titleInputRef}
                                            type="text"
                                            placeholder={isPersonalWorkspace ? "Buy groceries" : "Implement Auth Flow"}
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-zinc-500/50 focus:border-zinc-700 outline-none transition-all text-zinc-900 dark:text-zinc-200 text-sm"
                                            required
                                            autoComplete="off"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                                            Description
                                        </label>
                                        <textarea
                                            placeholder="Details about the task..."
                                            value={desc}
                                            onChange={(e) => setDesc(e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-zinc-500/50 focus:border-zinc-700 outline-none transition-all text-zinc-900 dark:text-zinc-200 text-sm resize-none"
                                        />
                                    </div>

                                    {/* Team Selection (if not personal workspace) */}
                                    {!isPersonalWorkspace && (
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                                                Team *
                                            </label>
                                            <select
                                                value={teamId}
                                                onChange={(e) => setTeamId(e.target.value)}
                                                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-zinc-500/50 focus:border-zinc-700 outline-none transition-all text-zinc-900 dark:text-zinc-200 text-sm"
                                                required
                                            >
                                                {!teamId && <option value="" disabled>Select a team</option>}
                                                {teams?.map((team: { id: string, name: string }) => (
                                                    <option key={team.id} value={team.id}>
                                                        {team.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Assign to Me Checkbox */}
                                    <div className="flex items-center gap-2 pt-1">
                                        <input
                                            type="checkbox"
                                            id="assignToMe"
                                            checked={assignToMe}
                                            disabled={isCheckboxDisabled}
                                            onChange={(e) => {
                                                setAssignToMe(e.target.checked);
                                                if (e.target.checked && currentUserId) {
                                                    setAssignedToId(currentUserId);
                                                } else {
                                                    setAssignedToId("");
                                                }
                                            }}
                                            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-zinc-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                        <label htmlFor="assignToMe" className={`text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer select-none ${isCheckboxDisabled && "cursor-not-allowed opacity-50"}`}>
                                            Assign to me
                                        </label>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
                                    {/* Priority */}
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                                            Priority *
                                        </label>
                                        <select
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value)}
                                            className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-zinc-500/50 focus:border-zinc-700 outline-none transition-all text-zinc-900 dark:text-zinc-200 text-sm"
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>

                                    {/* Deadline */}
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                                            Deadline *
                                        </label>
                                        <input
                                            type="date"
                                            value={deadline}
                                            onChange={(e) => setDeadline(e.target.value)}
                                            className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-zinc-500/50 focus:border-zinc-700 outline-none transition-all text-zinc-900 dark:text-zinc-200 text-sm [color-scheme:light] dark:[color-scheme:dark]"
                                            required
                                        />
                                    </div>

                                    {/* Required Skill */}
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                                            Required Skill
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. React, Python"
                                            value={requiredSkill}
                                            onChange={(e) => setRequiredSkill(e.target.value)}
                                            className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-zinc-500/50 focus:border-zinc-700 outline-none transition-all text-zinc-900 dark:text-zinc-200 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-900">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 font-medium transition-all text-sm"
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={createTaskMutation.isPending}
                                    className="px-6 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-700 dark:hover:bg-white text-white dark:text-black font-semibold shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                                >
                                    {createTaskMutation.isPending ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Creating...
                                        </div>
                                    ) : "Create Task"}
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
