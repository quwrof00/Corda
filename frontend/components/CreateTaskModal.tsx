import { useState } from "react";
import { useTeams } from "@/hooks/useTeams";
import { useCreateTask } from "@/hooks/useTasks";
import { Loader2, ListTodo, X } from "lucide-react";
import { toast } from "sonner";

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTaskCreated?: () => void;
    initialTeamId?: string;
}

export default function CreateTaskModal({ isOpen, onClose, onTaskCreated, initialTeamId }: CreateTaskModalProps) {
    const { data: teams } = useTeams();
    const createTaskMutation = useCreateTask();

    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [deadline, setDeadline] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [requiredSkill, setRequiredSkill] = useState("");
    const [teamId, setTeamId] = useState(initialTeamId || "");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await createTaskMutation.mutateAsync({
                title,
                description: desc,
                deadline: deadline ? new Date(deadline).toISOString() : new Date().toISOString(), // Use ISO string for consistency. Fallback to today.
                priority,
                requiredSkill,
                teamId,
                assignedToId: undefined, // Reverted to null/undefined. Pool tasks.
            });

            if (onTaskCreated) {
                onTaskCreated();
            }
            onClose();
            toast.success("Task created successfully!");

            // Reset form
            setTitle("");
            setDesc("");
            setDeadline("");
            setPriority("Medium");
            setRequiredSkill("");
            setTeamId(initialTeamId || "");
        } catch (err) {
            console.error(err);
            toast.error("Failed to create task.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-card border border-zinc-800 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <div className="p-6 md:p-8">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-900">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-100 shadow-sm border border-zinc-800">
                                <ListTodo className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-zinc-100">New Task</h1>
                                <p className="text-zinc-500 text-sm mt-0.5">Create a task for your team</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Task Title
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Implement Auth Flow"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-zinc-700/50 focus:border-zinc-700 outline-none transition-all text-zinc-200 placeholder-zinc-600"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Description
                            </label>
                            <textarea
                                placeholder="Details about the task..."
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-zinc-700/50 focus:border-zinc-700 outline-none transition-all text-zinc-200 placeholder-zinc-600 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Team Selection */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    Assign to Team
                                </label>
                                <div className="relative">
                                    <select
                                        value={teamId}
                                        onChange={(e) => setTeamId(e.target.value)}
                                        className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-zinc-700/50 focus:border-zinc-700 outline-none transition-all text-zinc-200 appearance-none"
                                        required
                                    >
                                        <option value="" disabled>Select a team</option>
                                        {teams?.map((team: { id: string, name: string }) => (
                                            <option key={team.id} value={team.id}>
                                                {team.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-zinc-500">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                    </div>
                                </div>
                            </div>

                            {/* Required Skill */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    Required Skill
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. React, Python"
                                    value={requiredSkill}
                                    onChange={(e) => setRequiredSkill(e.target.value)}
                                    className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-zinc-700/50 focus:border-zinc-700 outline-none transition-all text-zinc-200 placeholder-zinc-600"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    Priority
                                </label>
                                <div className="relative">
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-zinc-700/50 focus:border-zinc-700 outline-none transition-all text-zinc-200 appearance-none"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-zinc-500">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                    </div>
                                </div>
                            </div>

                            {/* Deadline */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    Deadline
                                </label>
                                <input
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-zinc-700/50 focus:border-zinc-700 outline-none transition-all text-zinc-200 placeholder-zinc-600 [color-scheme:dark]"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-6 flex items-center justify-end gap-3 border-t border-zinc-900">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-900 font-medium transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createTaskMutation.isPending}
                                className="px-8 py-3 rounded-xl bg-zinc-100 hover:bg-white text-black font-semibold shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-[1px]"
                            >
                                {createTaskMutation.isPending ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating...
                                    </div>
                                ) : "Create Task"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
