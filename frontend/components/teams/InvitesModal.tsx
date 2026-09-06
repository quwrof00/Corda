"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Trash2, Mail, Users, ArrowRight } from "lucide-react";
import { useModalStore } from "@/hooks/useModalStore";
import { useInvites, useAcceptInvite, useDeleteInvite } from "@/hooks/useInvites";
import { toast } from "sonner";
import { clsx } from "clsx";

function formatDistanceToNow(dateString: string | Date) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minutes`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} days`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} months`;
    return `${Math.floor(diffInDays / 365)} years`;
}

export default function InvitesModal() {
    const { isInvitesModalOpen, closeInvitesModal } = useModalStore();
    const { data: invitesData, isLoading } = useInvites({ enabled: isInvitesModalOpen });
    const acceptInvite = useAcceptInvite();
    const deleteInvite = useDeleteInvite();
    const [activeTab, setActiveTab] = useState<"received" | "sent">("received");

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                closeInvitesModal();
            }
        };

        if (isInvitesModalOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isInvitesModalOpen, closeInvitesModal]);

    if (!isInvitesModalOpen) return null;

    const received = invitesData?.received || [];
    const sent = invitesData?.sent || [];

    const handleAccept = async (id: string) => {
        try {
            await acceptInvite.mutateAsync(id);
            toast.success("Invite accepted");
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to accept invite");
        }
    };

    const handleDelete = async (id: string, isReceived: boolean) => {
        try {
            await deleteInvite.mutateAsync(id);
            toast.success(isReceived ? "Invite declined" : "Invite canceled");
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to delete invite");
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1, ease: "easeOut" }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 overflow-hidden cursor-pointer"
                onClick={closeInvitesModal}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ duration: 0.1, ease: "easeOut" }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-2xl bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[85vh] cursor-default"
                >
                    <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Invites</h2>
                            <p className="text-xs text-zinc-500 mt-1">Manage your received and sent invitations.</p>
                        </div>
                        <button
                            onClick={closeInvitesModal}
                            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors text-zinc-500 dark:text-zinc-400"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-6 pt-2 gap-6">
                        <button
                            onClick={() => setActiveTab("received")}
                            className={clsx(
                                "pb-3 text-sm font-semibold transition-colors relative flex items-center gap-2",
                                activeTab === "received" ? "text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            )}
                        >
                            Received
                            {received.length > 0 && (
                                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[1.25rem] flex items-center justify-center">
                                    {received.length}
                                </span>
                            )}
                            {activeTab === "received" && (
                                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("sent")}
                            className={clsx(
                                "pb-3 text-sm font-semibold transition-colors relative",
                                activeTab === "sent" ? "text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            )}
                        >
                            Sent
                            {activeTab === "sent" && (
                                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white" />
                            )}
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="w-6 h-6 border-2 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : activeTab === "received" ? (
                            <div className="space-y-4">
                                {received.length === 0 ? (
                                    <div className="text-center py-12 text-zinc-500 text-sm">
                                        <Mail className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                        No pending invites received.
                                    </div>
                                ) : (
                                    received.map((invite) => (
                                        <div key={invite.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-bold">
                                                    {invite.team?.name?.substring(0, 2).toUpperCase() || "TM"}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">{invite.team?.name}</h3>
                                                    <p className="text-xs text-zinc-500 mt-0.5">Invited {formatDistanceToNow(new Date(invite.createdAt))} ago</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleDelete(invite.id, true)}
                                                    className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Decline"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleAccept(invite.id)}
                                                    className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center gap-1.5"
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                    Accept
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {sent.length === 0 ? (
                                    <div className="text-center py-12 text-zinc-500 text-sm">
                                        <Users className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                        You haven't sent any invites yet.
                                    </div>
                                ) : (
                                    sent.map((invite) => (
                                        <div key={invite.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 gap-4">
                                            <div>
                                                <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">{invite.email}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs font-medium text-zinc-500 bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                                        {invite.team?.name}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-400">
                                                        Sent {formatDistanceToNow(new Date(invite.createdAt))} ago
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {invite.acceptedAt ? (
                                                    <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-md flex items-center gap-1">
                                                        <Check className="w-3 h-3" /> Accepted
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md">
                                                        Pending
                                                    </span>
                                                )}
                                                {!invite.acceptedAt && (
                                                    <button
                                                        onClick={() => handleDelete(invite.id, false)}
                                                        className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                                                        title="Cancel Invite"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
