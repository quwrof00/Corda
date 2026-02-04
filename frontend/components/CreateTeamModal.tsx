
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { Loader2, Users, X } from "lucide-react";
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
        setLoading(true);

        try {
            await api.post("/teams", {
                name,
                description,
                members: session?.user?.id ? [session.user.id] : [],
                leaderId: session?.user?.id,
            });
            toast.success("Team created successfully");
            if (onTeamCreated) {
                onTeamCreated();
            }
            onClose();
            setName("");
            setDescription("");
        } catch (err) {
            console.error(err);
            toast.error("Failed to create team");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose} // Close on click outside
        >
            <div
                className="w-full max-w-2xl bg-card border border-zinc-800 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
                <div className="p-6 md:p-8">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-900">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-100 shadow-sm border border-zinc-800">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-zinc-100">Create Team</h1>
                                <p className="text-zinc-500 text-sm mt-0.5">Start a new team to collaborate</p>
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
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Team Name
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Engineering Team"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-zinc-700/50 focus:border-zinc-700 outline-none transition-all text-zinc-200 placeholder-zinc-600"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Description
                            </label>
                            <textarea
                                placeholder="What is this team about?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-zinc-700/50 focus:border-zinc-700 outline-none transition-all text-zinc-200 placeholder-zinc-600 resize-none"
                            />
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
                                disabled={loading}
                                className="px-8 py-3 rounded-xl bg-zinc-100 hover:bg-white text-black font-semibold shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-[1px]"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating...
                                    </div>
                                ) : "Create Team"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
