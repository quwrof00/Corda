import { useEffect } from "react";
import { Task, Member } from "./types";
import { Loader2, Trash2 } from "lucide-react";
import { cn } from "./utils";

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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl rounded-2xl"
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
    editingTeamEnableAll: boolean;
    setEditingTeamEnableAll: (val: boolean) => void;
    isActualLeader: boolean;
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
    editingTeamEnableAll,
    setEditingTeamEnableAll,
    isActualLeader,
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-zinc-950 p-6 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg shadow-2xl rounded-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSaveTeam} className="space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">Edit Team</h3>
                        <p className="text-xs text-zinc-500 mb-4">Adjust team settings and permissions.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Team Name</label>
                            <input value={editingTeamName} onChange={e => setEditingTeamName(e.target.value)} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 text-sm rounded-xl outline-none focus:border-zinc-500 transition-colors" placeholder="Team Name" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Description</label>
                            <textarea value={editingTeamDesc} onChange={e => setEditingTeamDesc(e.target.value)} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 text-sm h-32 rounded-xl resize-none outline-none focus:border-zinc-500 transition-colors" placeholder="Description" />
                        </div>

                        {/* Enable All Permissions Toggle */}
                        {isActualLeader && (
                            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-bold text-zinc-900 dark:text-zinc-200">Open Permissions</label>
                                    <p className="text-[10px] text-zinc-500">Allow all members to have leader permissions.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditingTeamEnableAll(!editingTeamEnableAll)}
                                    className={cn(
                                        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                        editingTeamEnableAll ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                            editingTeamEnableAll ? "translate-x-5" : "translate-x-0"
                                        )}
                                    />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-xs font-medium">Cancel</button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-black px-6 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                            Save Changes
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-zinc-950 p-6 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg shadow-2xl rounded-2xl"
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
