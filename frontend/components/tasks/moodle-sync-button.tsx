"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FolderSync, X, Loader2 } from "lucide-react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/components/teams/utils";

interface MoodleSyncButtonProps {
    variant?: "button" | "card";
}

export default function MoodleSyncButton({ variant = "button" }: MoodleSyncButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [url, setUrl] = useState("");
    const [mounted, setMounted] = useState(false);
    const queryClient = useQueryClient();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch current status
    const { data: config, isLoading: isLoadingConfig } = useQuery({
        queryKey: ["moodle-config"],
        queryFn: async () => {
            const res = await axios.get("/api/moodle");
            return res.data;
        },
    });

    // Sync mutation
    const syncMutation = useMutation({
        mutationFn: async ({
            icsUrl,
            syncNow,
            force,
        }: {
            icsUrl?: string;
            syncNow?: boolean;
            force?: boolean;
        }) => {
            const res = await axios.post("/api/moodle", { icsUrl, syncNow, force });
            return res.data;
        },
        onSuccess: (data) => {
            if (data.skipped) {
                toast.info(data.message || "Sync Skipped");
            } else if (data.count !== undefined) {
                toast.success(`Synced ${data.count} tasks from Moodle`);
                queryClient.invalidateQueries({ queryKey: ["tasks"] });
            } else {
                toast.success("Moodle configuration updated");
            }
            queryClient.invalidateQueries({ queryKey: ["moodle-config"] });
            setIsOpen(false);
        },
        onError: (error) => {
            toast.error("Could not sync with Moodle. Check the URL.");
            console.error(error);
        },
    });

    const handleSync = () => {
        console.log("Sync Pressed");

        if (!url && !config?.icsUrl) {
            toast.error("Please enter your Moodle ICS Calendar URL");
            return;
        }
        syncMutation.mutate({ icsUrl: url || config?.icsUrl, syncNow: true, force: true });
    };

    return (
        <>
            {variant === "button" ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700 h-10"
                >
                    <FolderSync className="w-4 h-4" />
                    <span>Sync LMS</span>
                </button>
            ) : (
                <motion.div
                    onClick={(e) => {
                        e.stopPropagation();
                        // Always open modal to configure or sync manually
                        setIsOpen(true);
                    }}
                    className={cn(
                        "relative group p-3 sm:p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 cursor-pointer transition-all hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50 h-32 flex flex-col justify-between overflow-hidden",
                        (syncMutation.isPending || isLoadingConfig) ? "opacity-70 pointer-events-none" : "hover:border-zinc-300 dark:hover:border-zinc-700"
                    )}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold shadow-sm group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40 transition-colors">
                                <FolderSync className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm sm:text-base text-zinc-800 dark:text-zinc-200 leading-tight group-hover:text-black dark:group-hover:text-white transition-colors">
                                    LMS Sync
                                </h3>
                                <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-600 uppercase tracking-wider font-bold">
                                    Integration
                                </p>
                            </div>
                        </div>
                        {config?.isActive && (
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Active"></div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono">
                        <div className="flex flex-col">
                            <span className="text-zinc-500 uppercase text-[10px] font-bold">Status</span>
                            <span className={config?.isActive ? "text-emerald-500 font-medium text-xs sm:text-sm" : "text-zinc-400 font-medium text-xs sm:text-sm"}>
                                {config?.isActive ? "Active" : "Not Set"}
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}

            {mounted && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-zinc-200 dark:border-zinc-800"
                            >
                                <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
                                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Sync Moodle Tasks</h2>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-6">
                                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-sm text-indigo-900 dark:text-indigo-200 flex gap-3 items-start">
                                        <div className="mt-0.5 shrink-0">ℹ️</div>
                                        <p>
                                            Enter your Moodle Calendar ICS URL to automatically import assignments and deadlines directly into your task board.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                            ICS Calendar URL
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="https://moodle.example.edu/calendar/export_execute.php..."
                                            value={url || config?.icsUrl || ""}
                                            onChange={(e) => setUrl(e.target.value)}
                                            className="w-full px-4 py-3 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                                        />
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-1">
                                            Find this in Moodle Calendar settings under <span className="font-medium text-zinc-900 dark:text-zinc-200">Export Calendar</span>.
                                        </p>
                                    </div>

                                    {config?.lastSyncedAt && (
                                        <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-xs border border-zinc-200 dark:border-zinc-800">
                                            <div className="text-zinc-500 dark:text-zinc-400">
                                                Last synced: <span className="font-medium text-zinc-900 dark:text-zinc-200">{new Date(config.lastSyncedAt).toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`w-2 h-2 rounded-full ${config.isActive ? "bg-emerald-500" : "bg-amber-500"}`} />
                                                <span className={config.isActive ? "text-emerald-700 dark:text-emerald-400 font-medium" : "text-amber-700 dark:text-amber-400 font-medium"}>
                                                    {config.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-5 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSync}
                                        disabled={syncMutation.isPending || isLoadingConfig}
                                        className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-95"
                                    >
                                        {syncMutation.isPending ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Syncing...
                                            </>
                                        ) : (
                                            "Sync Now"
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
