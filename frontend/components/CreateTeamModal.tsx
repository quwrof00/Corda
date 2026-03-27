import { LoadingBars } from "@/components/shared/LoadingBars";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { Users, X } from "lucide-react";
import { toast } from "sonner";

interface CreateTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTeamCreated?: () => void;
}

export default function CreateTeamModal({ isOpen, onClose, onTeamCreated }: CreateTeamModalProps) {
    const { data: session } = useSession();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [enableAll, setEnableAll] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate that the name is not "Personal" (case-insensitive)
        if (name.trim().toLowerCase() === "personal") {
            toast.error("The name 'Personal' is reserved for your personal workspace");
            return;
        }

        setLoading(true);

        try {
            await api.post("/teams", {
                name,
                description,
                members: session?.user?.id ? [session.user.id] : [],
                leaderId: session?.user?.id,
                enableAll,
            });
            toast.success("Team created successfully");
            if (onTeamCreated) {
                onTeamCreated();
            }
            onClose();
            setName("");
            setDescription("");
            setEnableAll(false);
        } catch (err) {
            console.error(err);
            toast.error("Failed to create team");
        } finally {
            setLoading(false);
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
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-hidden"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
                        className="w-full max-w-lg bg-background border border-[var(--border-time)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header - Fixed to top */}
                        <div className="flex-none flex items-center justify-between p-5 border-b border-[var(--border-time)] bg-[var(--header-time)]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center shadow-sm">
                                    <Users className="w-5 h-5 text-white dark:text-black" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Create Team</h1>
                                    <p className="text-zinc-500 text-xs font-medium">Start a new team to collaborate</p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
                                title="Close (Esc)"
                                type="button"
                            >
                                <X className="w-5 h-5" />
                            </motion.button>
                        </div>

                        {/* Form - Flexible container */}
                        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">

                            {/* Scrollable Content Area */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                        Team Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Engineering Team"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-[var(--header-time)] border border-[var(--border-time)] rounded-lg focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:border-zinc-900 dark:focus:border-white outline-none transition-all text-zinc-900 dark:text-zinc-200 text-sm placeholder:text-zinc-400"
                                        required
                                        autoComplete="off"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                        Description
                                    </label>
                                    <textarea
                                        placeholder="What is this team about?"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2.5 bg-[var(--header-time)] border border-[var(--border-time)] rounded-lg focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:border-zinc-900 dark:focus:border-white outline-none transition-all text-zinc-900 dark:text-zinc-200 text-sm placeholder:text-zinc-400 resize-none"
                                    />
                                </div>

                                {/* Permission Toggle */}
                                <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl mt-2">
                                    <div className="space-y-0.5">
                                        <label className="text-sm font-bold text-zinc-900 dark:text-zinc-200">Open Permissions</label>
                                        <p className="text-[10px] text-zinc-500 max-w-[240px]">Allow all members to create and edit tasks, run allocations, and manage the team.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setEnableAll(!enableAll)}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enableAll ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800"}`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enableAll ? "translate-x-5" : "translate-x-0"}`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Footer Actions - Fixed to bottom */}
                            <div className="flex-none flex items-center justify-between p-5 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900">
                                <span className="text-xs text-zinc-400 font-medium">
                                    * Required fields
                                </span>
                                <div className="flex items-center gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="button"
                                        onClick={onClose}
                                        className="px-5 py-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 font-medium transition-all text-sm"
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm flex items-center gap-2 font-semibold shadow-lg shadow-zinc-500/10"
                                    >
                                        {loading ? (
                                            <>
                                                <LoadingBars className="w-4 h-4" />
                                                <span>Creating...</span>
                                            </>
                                        ) : (
                                            <span>Create Team</span>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
