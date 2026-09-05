"use client";
import { LoadingBars } from "@/components/shared/LoadingBars";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useUpdateUser } from "@/hooks/useUser";
import { Save, User, FileUp, Trash2, Settings } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SettingsClient() {
    const { data: session, status } = useSession();
    const userId = session?.user?.id;

    const { data: user, isLoading } = useUser(userId ?? "", { enabled: !!userId });
    const shouldShowSkeleton = status === "loading" || isLoading || !user;

    const updateUserMutation = useUpdateUser();

    const [autoDeleteStaleTasks, setAutoDeleteStaleTasks] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [wallpaperUploadStatus, setWallpaperUploadStatus] = useState<"IDLE" | "UPLOADING" | "COMPLETE">("IDLE");
    const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setWallpaperUrl((user.wallpaperUrl as string | null) ?? null);
            setAutoDeleteStaleTasks(user.autoDeleteStaleTasks ?? false);
        }
    }, [user, session]);

    if (!session && status !== "loading") return null;

    const handleSave = () => {
        if (!userId) return;

        updateUserMutation.mutate(
            { id: userId, data: { autoDeleteStaleTasks } },
            {
                onSuccess: () => {
                    setIsEditing(false);
                    toast.success("Settings updated successfully");
                    
                    // If the user opted in, immediately trigger the cleanup job
                    if (autoDeleteStaleTasks) {
                        toast.promise(
                            fetch("/api/cleanup", { method: "GET" }).then(res => {
                                if (!res.ok) throw new Error("Cleanup trigger returned " + res.status);
                                return res.text();
                            }),
                            {
                                loading: "Sweeping existing stale tasks...",
                                success: (data) => data || "Old tasks removed",
                                error: "Local development server doesn't support the Vercel Go function endpoint.",
                            }
                        );
                    }
                },
                onError: () => {
                    toast.error("Failed to update settings");
                }
            }
        );
    };

    const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Only JPEG, PNG, WebP, and AVIF images are allowed");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size must be less than 10MB");
            return;
        }

        const previousUrl = wallpaperUrl;
        const previewUrl = URL.createObjectURL(file);
        setWallpaperUrl(previewUrl);
        setWallpaperUploadStatus("UPLOADING");

        try {
            const compressedBlob = await new Promise<Blob>((resolve, reject) => {
                const worker = new Worker(new URL('../profile/image.worker.ts', import.meta.url));
                
                worker.onmessage = (e) => {
                    if (e.data.success) {
                        resolve(e.data.blob);
                    } else {
                        reject(new Error(e.data.error));
                    }
                    worker.terminate();
                };
                
                worker.onerror = (error) => {
                    reject(error);
                    worker.terminate();
                };
                
                worker.postMessage({ file, maxWidth: 1920, maxHeight: 1080, quality: 0.8 });
            });

            const formData = new FormData();
            formData.append("wallpaper", compressedBlob, file.name.replace(/\.[^/.]+$/, "") + ".webp");

            const response = await fetch(`/api/users/${userId}/wallpaper`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Upload failed");

            const data = await response.json();
            URL.revokeObjectURL(previewUrl);
            setWallpaperUrl(data.wallpaperUrl);
            setWallpaperUploadStatus("COMPLETE");
            setTimeout(() => setWallpaperUploadStatus("IDLE"), 1000);
            toast.success("Wallpaper uploaded successfully");
        } catch (error) {
            console.error(error);
            URL.revokeObjectURL(previewUrl);
            setWallpaperUrl(previousUrl); 
            toast.error("Failed to upload wallpaper");
            setWallpaperUploadStatus("IDLE");
        }
    };

    const handleWallpaperDelete = async () => {
        if (!wallpaperUrl) return;
        
        const previousUrl = wallpaperUrl;
        setWallpaperUrl(null);
        setWallpaperUploadStatus("UPLOADING");

        try {
            const response = await fetch(`/api/users/${userId}/wallpaper`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Delete failed");

            toast.success("Wallpaper deleted successfully");
        } catch (error) {
            console.error(error);
            setWallpaperUrl(previousUrl); 
            toast.error("Failed to delete wallpaper");
        } finally {
            setWallpaperUploadStatus("IDLE");
        }
    };

    return (
        <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-background text-zinc-300 font-sans p-6 lg:p-12 mb-20 selection:bg-zinc-800 relative"
        >
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-10 pb-6 border-b border-[var(--border-time)]">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-zinc-900 border border-[var(--border-time)] flex items-center justify-center text-white rounded-xl shadow-lg">
                            <Settings className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white uppercase tracking-tight font-mono">Settings</h1>
                            <p className="text-zinc-500 text-xs font-mono uppercase mt-1">ID: {userId?.substring(0, 8)}...</p>
                        </div>
                    </div>
                    {isEditing && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSave}
                            disabled={updateUserMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-zinc-200 text-black rounded-lg shadow-sm transition-all text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-wait cursor-pointer"
                        >
                            {updateUserMutation.isPending ? <LoadingBars className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                            Save Changes
                        </motion.button>
                    )}
                </div>

                {shouldShowSkeleton ? (
                    <div className="animate-pulse space-y-8">
                        <div className="h-40 bg-zinc-900 rounded-xl"></div>
                        <div className="h-40 bg-zinc-900 rounded-xl"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Preferences */}
                        <div className="space-y-6">
                            <div className="bg-card border border-[var(--border-time)] p-6 shadow-xl rounded-xl">
                                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 font-mono border-b border-[var(--border-time)] pb-2">Task Management</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white text-sm font-mono uppercase">Auto-Delete Stale Tasks</p>
                                            <p className="text-zinc-500 text-xs mt-1">Automatically remove your completed personal tasks after 30 days.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { setAutoDeleteStaleTasks(!autoDeleteStaleTasks); setIsEditing(true); }}
                                            className={cn(
                                                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                                autoDeleteStaleTasks ? "bg-emerald-500" : "bg-zinc-800"
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                    autoDeleteStaleTasks ? "translate-x-5" : "translate-x-0"
                                                )}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Wallpaper Section */}
                        <div className="bg-card border border-[var(--border-time)] p-8 shadow-xl rounded-xl">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-time)]">
                                <h2 className="text-lg font-bold text-white font-mono uppercase tracking-tight">Dashboard Wallpaper</h2>
                            </div>

                            {wallpaperUrl ? (
                                <div className="flex flex-col gap-4">
                                    <div className="relative w-full h-40 rounded-lg overflow-hidden border border-[var(--border-time)]">
                                        <img src={wallpaperUrl} alt="Wallpaper Preview" className="absolute inset-0 w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40" />
                                        <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded text-[10px] font-mono text-white tracking-widest uppercase">Preview</div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-[var(--border-time)] rounded-lg transition-colors">
                                        <div className="flex items-center gap-3">
                                            <FileUp className="w-5 h-5 text-emerald-500" />
                                            <div>
                                                <p className="text-white text-sm font-mono uppercase">Wallpaper Active</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleWallpaperDelete}
                                            disabled={wallpaperUploadStatus !== "IDLE"}
                                            className="flex items-center gap-2 px-3 py-2 bg-red-950/30 hover:bg-red-950/50 border border-red-900/50 text-red-400 rounded-md text-xs font-bold uppercase transition-colors disabled:opacity-50 disabled:cursor-wait cursor-pointer"
                                        >
                                            {wallpaperUploadStatus !== "IDLE" ? <LoadingBars className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />} Remove
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    <input type="file" id="wallpaper-upload" accept="image/jpeg,image/png,image/webp,image/avif" onChange={handleWallpaperUpload} disabled={wallpaperUploadStatus !== "IDLE"} className="hidden" />
                                    <label htmlFor="wallpaper-upload" className={cn("flex items-center justify-center gap-3 p-8 bg-zinc-900/20 border-2 border-dashed border-[var(--border-time)] hover:border-[var(--accent-time)] rounded-lg cursor-pointer transition-all", wallpaperUploadStatus !== "IDLE" && "opacity-50 cursor-not-allowed")}>
                                        {wallpaperUploadStatus !== "IDLE" ? <LoadingBars className="w-6 h-6 text-emerald-500" /> : <><FileUp className="w-6 h-6 text-emerald-500" /><div className="text-center"><span className="text-white text-base font-mono uppercase block">Upload Image</span><span className="text-zinc-600 text-[10px] uppercase">(JPG/PNG/WEBP/AVIF)</span></div></>}
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </motion.main>
    );
}
