import { useEffect } from "react";
import { Task, Member } from "./types";
import { Loader2, Trash2 } from "lucide-react";

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    inviteLink: string;
    inviteEmail: string;
    setInviteEmail: (email: string) => void;
    handleInvite: (e: React.FormEvent) => void;
    inviteLoading: boolean;
}

export function InviteModal({
    isOpen,
    onClose,
    inviteLink,
    inviteEmail,
    setInviteEmail,
    handleInvite,
    inviteLoading
}: InviteModalProps) {
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

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-card border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl rounded-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-2">Invite New Member</h3>
                {!inviteLink ? (
                    <form onSubmit={handleInvite} className="space-y-4">
                        <input type="email" placeholder="Email Address" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 text-sm outline-none focus:border-zinc-500 rounded-xl" required />
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>
                            <button
                                type="submit"
                                disabled={inviteLoading}
                                className="px-4 py-2 bg-white text-black text-xs font-bold hover:bg-zinc-200 rounded-lg flex items-center gap-2"
                            >
                                {inviteLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                                {inviteLoading ? "Sending..." : "Send Invite"}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <p className="text-emerald-500 text-xs">Link Generated Successfully.</p>
                        <input readOnly value={inviteLink} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-mono cursor-text select-all rounded-xl" />
                        <button onClick={onClose} className="w-full py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg">Done</button>
                    </div>
                )}
            </div>
        </div>
    );
}

interface EditTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingTeamName: string;
    setEditingTeamName: (val: string) => void;
    editingTeamDesc: string;
    setEditingTeamDesc: (val: string) => void;
    handleSaveTeam: (e: React.FormEvent) => void;
    isPending: boolean;
}

export function EditTeamModal({
    isOpen,
    onClose,
    editingTeamName,
    setEditingTeamName,
    editingTeamDesc,
    setEditingTeamDesc,
    handleSaveTeam,
    isPending
}: EditTeamModalProps) {
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

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-card p-6 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg shadow-2xl rounded-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSaveTeam} className="space-y-4">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Edit Team</h3>
                    <input value={editingTeamName} onChange={e => setEditingTeamName(e.target.value)} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 text-sm rounded-xl" placeholder="Team Name" />
                    <textarea value={editingTeamDesc} onChange={e => setEditingTeamDesc(e.target.value)} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 text-sm h-32 rounded-xl resize-none" placeholder="Description" />
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-xs">Cancel</button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="bg-white text-black px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2"
                        >
                            {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface EditTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingTask: Task | null;
    setEditingTask: (task: Task | null) => void;
    isLeader: boolean;
    handleSaveTask: (e: React.FormEvent) => void;
    handleDeleteTask: () => void;
    updateTaskPending: boolean;
    deleteTaskPending: boolean;
    members: Member[] | undefined;
}

export function EditTaskModal({
    isOpen,
    onClose,
    editingTask,
    setEditingTask,
    isLeader,
    handleSaveTask,
    handleDeleteTask,
    updateTaskPending,
    deleteTaskPending,
    members
}: EditTaskModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !editingTask || !isLeader) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-card p-6 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg shadow-2xl rounded-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSaveTask} className="space-y-4">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Edit Task</h3>
                    <input value={editingTask.title} onChange={e => setEditingTask({ ...editingTask, title: e.target.value })} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 text-sm rounded-xl" placeholder="Task Title" />
                    <input value={editingTask.requiredSkill || ""} onChange={e => setEditingTask({ ...editingTask, requiredSkill: e.target.value })} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 text-sm rounded-xl" placeholder="Required Skill" />
                    <select value={editingTask.assignedToId || ""} onChange={e => setEditingTask({ ...editingTask, assignedToId: e.target.value })} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 text-sm rounded-xl">
                        <option value="">-- Unassigned --</option>
                        {members?.map((m: Member) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <input
                        type="date"
                        value={editingTask.deadline ? new Date(editingTask.deadline).toISOString().split('T')[0] : ""}
                        onChange={e => setEditingTask({ ...editingTask, deadline: e.target.value })}
                        className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 text-sm rounded-xl [color-scheme:light] dark:[color-scheme:dark]"
                    />
                    <div className="flex justify-between items-center pt-2">
                        <button
                            type="button"
                            onClick={handleDeleteTask}
                            disabled={deleteTaskPending}
                            className="text-red-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-950/20 transition-colors"
                            title="Delete Task"
                        >
                            {deleteTaskPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-xs">Cancel</button>
                            <button
                                type="submit"
                                disabled={updateTaskPending}
                                className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-black px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2"
                            >
                                {updateTaskPending && <Loader2 className="w-3 h-3 animate-spin" />}
                                Save
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
