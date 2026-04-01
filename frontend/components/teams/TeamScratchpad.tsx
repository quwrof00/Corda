"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Edit3, Eye, FileText, User, Clock, Pen } from "lucide-react";
import { Team } from "./types";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "./utils";
import ReactMarkdown from "react-markdown";

import { useUpdateTeam } from "@/hooks/useTeams";

interface TeamScratchpadProps {
    team: Team;
    isOpen: boolean;
    onClose: () => void;
    currentUserId?: string;
}

export function TeamScratchpad({ team, isOpen, onClose, currentUserId }: TeamScratchpadProps) {
    const [content, setContent] = useState(team.scratchpad || "");
    const [isEditing, setIsEditing] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [remoteContent, setRemoteContent] = useState<string | null>(null);

    const updateTeamMutation = useUpdateTeam();
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Track what we last saw from the server to detect real changes
    const lastSeenServerContentRef = useRef<string>(team.scratchpad || "");

    // Sync from server
    useEffect(() => {
        const serverValue = team.scratchpad || "";

        // If the server value changed since we last saw it...
        if (serverValue !== lastSeenServerContentRef.current) {
            lastSeenServerContentRef.current = serverValue;

            // ...and it's different from what we have locally
            if (serverValue !== content) {
                if (!isTyping) {
                    setContent(serverValue);
                } else {
                    setRemoteContent(serverValue);
                }
            }
        }
    }, [team.scratchpad, isTyping, content]);

    const handleContentChange = (newContent: string) => {
        setContent(newContent);
        setIsTyping(true);
        setRemoteContent(null);

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
        }, 1500);

        saveTimeoutRef.current = setTimeout(() => {
            void saveContent(newContent);
        }, 1000); // Shorter delay for snappier feel
    };

    const saveContent = async (textToSave: string) => {
        if (!team.id) return;
        try {
            await updateTeamMutation.mutateAsync({
                id: team.id,
                scratchpad: textToSave
            });
            lastSeenServerContentRef.current = textToSave; // Prevent echo
            setLastSaved(new Date());
        } catch (err) {
            console.error("Failed to save scratchpad:", err);
        }
    };


    const handleApplyRemote = () => {
        if (remoteContent !== null) {
            setContent(remoteContent);
            setRemoteContent(null);
            toast.success("Scratchpad updated from server");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-xl bg-background border-l border-zinc-200 dark:border-zinc-800 z-[70] shadow-2xl flex flex-col pt-16 md:pt-0"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                                    <Pen className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                        Team Scratchpad
                                    </h2>
                                    <p className="text-xs text-zinc-500 font-medium flex items-center gap-2">
                                        {updateTeamMutation.isPending ? (
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3 animate-spin" /> Saving...
                                            </span>
                                        ) : lastSaved ? (
                                            <span className="flex items-center gap-1">
                                                <Save className="w-3 h-3" /> Saved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        ) : (
                                            "Collaborative team notes"
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className={cn(
                                        "p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold px-3",
                                        isEditing
                                            ? "bg-emerald-500/10 text-emerald-500"
                                            : "hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500"
                                    )}
                                >
                                    {isEditing ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                    {isEditing ? "View" : "Edit"}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 rounded-lg transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Remote update notification */}
                        <AnimatePresence>
                            {remoteContent !== null && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2 flex items-center justify-between overflow-hidden"
                                >
                                    <p className="text-xs text-emerald-400 font-medium">New changes available from another member</p>
                                    <button
                                        onClick={handleApplyRemote}
                                        className="text-xs font-bold text-emerald-500 hover:underline"
                                    >
                                        Update Now
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-0 flex flex-col font-sans">
                            {isEditing ? (
                                <textarea
                                    value={content}
                                    onChange={(e) => handleContentChange(e.target.value)}
                                    placeholder="Type something team-wide here... Use Markdown for better clarity."
                                    className="flex-1 p-8 bg-transparent text-zinc-900 dark:text-zinc-200 resize-none focus:outline-none font-mono text-sm leading-relaxed"
                                    spellCheck={false}
                                    autoFocus
                                />
                            ) : (
                                <div className="flex-1 p-8 prose dark:prose-invert max-w-none text-zinc-900 dark:text-zinc-300">
                                    {content ? (
                                        <ReactMarkdown
                                            components={{
                                                h1: ({ ...props }) => <h1 className="text-2xl font-bold mb-4 mt-6 text-zinc-100" {...props} />,
                                                h2: ({ ...props }) => <h2 className="text-xl font-bold mb-3 mt-5 text-zinc-200" {...props} />,
                                                p: ({ ...props }) => <p className="mb-4 leading-relaxed opacity-90" {...props} />,
                                                ul: ({ ...props }) => <ul className="list-disc pl-5 mb-4 opacity-90" {...props} />,
                                                li: ({ ...props }) => <li className="mb-1" {...props} />,
                                                code: ({ ...props }) => (
                                                    <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-emerald-400 font-mono text-xs" {...props} />
                                                ),
                                            }}
                                        >
                                            {content}
                                        </ReactMarkdown>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center py-20">
                                            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-200 dark:border-zinc-800">
                                                <FileText className="w-8 h-8 text-zinc-500" />
                                            </div>
                                            <h3 className="text-lg font-bold text-zinc-500">No notes yet</h3>
                                            <p className="text-sm text-zinc-600 mt-1 max-w-[240px]">
                                                Use the edit button to start adding links, instructions, or project goals.
                                            </p>
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="mt-6 px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black text-xs font-bold rounded-lg hover:opacity-90 transition-all"
                                            >
                                                Start Writing
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer / Tip */}
                        {isEditing && (
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500 font-mono tracking-wider opacity-60">
                                <span className="flex items-center gap-2"> AUTO-SAVING ENABLED</span>

                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
