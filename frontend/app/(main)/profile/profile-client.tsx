"use client";
import { LoadingBars } from "@/components/shared/LoadingBars";
import { ProfileSkeleton } from "@/components/shared/SkeletonLoader";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useUpdateUser } from "@/hooks/useUser";
import { Save, User, X, FileUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

// Skill categorization
const SKILL_CATEGORIES = {
    "Frontend": ["React", "Vue", "Angular", "Next.js", "TypeScript", "JavaScript", "HTML", "CSS", "Tailwind", "SCSS", "Redux", "Svelte"],
    "Backend": ["Node.js", "Python", "Java", "Go", "Ruby", "PHP", "C#", ".NET", "Express", "Django", "Flask", "Spring"],
    "Database": ["PostgreSQL", "MySQL", "MongoDB", "Redis", "SQL", "NoSQL", "Firebase", "Supabase", "DynamoDB"],
    "DevOps": ["Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD", "Jenkins", "GitHub Actions", "Terraform"],
    "Mobile": ["React Native", "Flutter", "Swift", "Kotlin", "iOS", "Android"],
    "Other": [] as string[]
};

const categorizeSkills = (skills: string[]) => {
    const categorized: Record<string, string[]> = {
        "Frontend": [],
        "Backend": [],
        "Database": [],
        "DevOps": [],
        "Mobile": [],
        "Other": []
    };

    skills.forEach(skill => {
        let placed = false;
        for (const [category, keywords] of Object.entries(SKILL_CATEGORIES)) {
            if (keywords.some(keyword => skill.toLowerCase().includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(skill.toLowerCase()))) {
                categorized[category].push(skill);
                placed = true;
                break;
            }
        }
        if (!placed) {
            categorized["Other"].push(skill);
        }
    });

    return Object.fromEntries(
        Object.entries(categorized).filter(([, skills]) => skills.length > 0)
    );
};

export default function ProfileClient() {
    const { data: session, status } = useSession();
    const userId = session?.user?.id;

    const { data: user, isLoading } = useUser(userId ?? "", { enabled: !!userId });
    const shouldShowSkeleton = status === "loading" || isLoading || !user;

    const updateUserMutation = useUpdateUser();

    const [skills, setSkills] = useState<string[]>([]);
    const [newSkill, setNewSkill] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<"IDLE" | "UPLOADING" | "PARSING" | "EXTRACTING" | "COMPLETE">("IDLE");
    const [resumeUrl, setResumeUrl] = useState<string | null>(null);
    // Only block UI for resume processing which requires document parsing
    const isProcessing = uploadStatus !== "IDLE" && uploadStatus !== "COMPLETE";


    useEffect(() => {
        if (user) {
            // Deduplicate on initial load
            const initialSkills = (user.skills || []).filter((s: string, i: number, arr: string[]) => 
                arr.findIndex(v => v.toLowerCase() === s.toLowerCase()) === i
            );
            setSkills(initialSkills);
            setResumeUrl((user.resumeUrl as string | null) ?? null);
        }
    }, [user, session]);

    if (!session && status !== "loading") return null;

    const handleAddSkill = () => {
        const trimmed = newSkill.trim();
        if (trimmed && !skills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
            const updatedSkills = [...skills, trimmed];
            setSkills(updatedSkills);
            setNewSkill("");
            setIsEditing(true);
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        const updatedSkills = skills.filter(s => s !== skillToRemove);
        setSkills(updatedSkills);
        setIsEditing(true);
    };

    const handleSave = () => {
        if (!userId) return;

        updateUserMutation.mutate(
            { id: userId, data: { skills } },
            {
                onSuccess: () => {
                    setIsEditing(false);
                    toast.success("Profile updated successfully");
                },
                onError: () => {
                    toast.error("Failed to update record");
                }
            }
        );
    };

    const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Only PDF and Word documents are allowed");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB");
            return;
        }

        setUploadStatus("UPLOADING");

        try {
            const progressInterval = setInterval(() => {
                setUploadStatus(prev => {
                    if (prev === "UPLOADING") return "PARSING";
                    if (prev === "PARSING") return "EXTRACTING";
                    return prev;
                });
            }, 2000);

            const formData = new FormData();
            formData.append("resume", file);

            const response = await fetch(`/api/users/${userId}/resume`, {
                method: "POST",
                body: formData,
            });

            clearInterval(progressInterval);

            if (!response.ok) throw new Error("Upload failed");

            const data = await response.json();
            setResumeUrl(data.resumeUrl);
            setUploadStatus("COMPLETE");
            setTimeout(() => setUploadStatus("IDLE"), 1000);

            if (data.allSkills && data.allSkills.length > 0) {
                // Deduplicate extracted skills
                const uniqueExtracted = data.allSkills.filter((s: string, i: number, arr: string[]) => 
                    arr.findIndex(v => v.toLowerCase() === s.toLowerCase()) === i
                );
                setSkills(uniqueExtracted);
                setIsEditing(true);
                toast.success(`Resume uploaded. Extracted skills!`);
            } else {
                toast.success("Resume uploaded successfully");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload resume");
            setUploadStatus("IDLE");
        }
    };

    const handleResumeDelete = async () => {
        if (!resumeUrl) return;
        setUploadStatus("UPLOADING");

        try {
            const response = await fetch(`/api/users/${userId}/resume`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Delete failed");

            setResumeUrl(null);
            toast.success("Resume deleted successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete resume");
        } finally {
            setUploadStatus("IDLE");
        }
    };

    const categorizedSkills = categorizeSkills(skills);

    return (
        <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-background text-zinc-300 font-sans p-6 lg:p-12 mb-20 selection:bg-zinc-800 relative"
        >
            {/* Global Processing Overlay */}
            <AnimatePresence>
                {isProcessing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md cursor-wait"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-zinc-900 border border-[var(--border-time)] p-10 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-sm relative"
                        >
                            <div className="w-16 h-16 bg-white/5 border border-[var(--border-time)] rounded-xl flex items-center justify-center mb-6">
                                <LoadingBars className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-2 font-mono">
                                {uploadStatus === "UPLOADING" ? "Uploading Docs" : 
                                 uploadStatus === "PARSING" ? "Parsing Identity" : 
                                 "Extracting Skills"}
                            </h2>
                            <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest leading-relaxed">
                                System processing in progress.<br />Please do not terminate session.
                            </p>
                            
                            {/* Scanning line effect */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                                <motion.div 
                                    animate={{ y: ["0%", "400%"] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="w-full h-px bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-[var(--border-time)]">
                    <div className="w-16 h-16 bg-zinc-900 border border-[var(--border-time)] flex items-center justify-center text-white rounded-xl shadow-lg">
                        <User className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white uppercase tracking-tight font-mono">Profile</h1>
                        <p className="text-zinc-500 text-xs font-mono uppercase mt-1">ID: {userId?.substring(0, 8)}...</p>
                    </div>
                </div>

                {shouldShowSkeleton ? (
                    <ProfileSkeleton />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-card border border-[var(--border-time)] p-6 shadow-xl rounded-xl">
                                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 font-mono border-b border-[var(--border-time)] pb-2">Metrics</h2>
                                <div className="space-y-4">
                                    <div className="p-4 bg-zinc-900/50 border border-[var(--border-time)] rounded-lg text-center transition-colors">
                                        <span className="block text-3xl font-bold text-white mb-1">{user?.teams?.length || 0}</span>
                                        <span className="text-[10px] text-zinc-500 uppercase font-bold">Teams</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="lg:col-span-2 space-y-6">

                            <div className="bg-card border border-[var(--border-time)] p-8 shadow-xl rounded-xl">
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-time)]">
                                    <h2 className="text-lg font-bold text-white font-mono uppercase tracking-tight">Resume</h2>
                                    {isEditing && (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleSave}
                                            disabled={updateUserMutation.isPending}
                                            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-zinc-200 text-black rounded-lg shadow-sm transition-all text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                                        >
                                            {updateUserMutation.isPending ? <LoadingBars className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                                            Save Data
                                        </motion.button>
                                    )}
                                </div>

                                {resumeUrl ? (
                                    <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-[var(--border-time)] rounded-lg transition-colors">
                                        <div className="flex items-center gap-3">
                                            <FileUp className="w-5 h-5 text-emerald-500" />
                                            <div>
                                                <p className="text-white text-sm font-mono uppercase">Resume Saved</p>
                                                <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 text-xs hover:text-white transition-colors underline decoration-dotted transition-colors">View File</a>
                                            </div>
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleResumeDelete}
                                            disabled={uploadStatus !== "IDLE"}
                                            className="flex items-center gap-2 px-3 py-2 bg-red-950/30 hover:bg-red-950/50 border border-red-900/50 text-red-400 rounded-md text-xs font-bold uppercase transition-colors disabled:opacity-50"
                                        >
                                            <Trash2 className="w-3 h-3" /> Delete
                                        </motion.button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input type="file" id="resume-upload" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} disabled={uploadStatus !== "IDLE"} className="hidden" />
                                        <label htmlFor="resume-upload" className={cn("flex items-center justify-center gap-3 p-8 bg-zinc-900/20 border-2 border-dashed border-[var(--border-time)] hover:border-[var(--accent-time)] rounded-lg cursor-pointer transition-all", uploadStatus !== "IDLE" && "opacity-50 cursor-not-allowed")}>
                                            {uploadStatus !== "IDLE" ? <LoadingBars className="w-6 h-6 text-emerald-500" /> : <><FileUp className="w-6 h-6 text-emerald-500" /><div className="text-center"><span className="text-white text-base font-mono uppercase block">Upload Resume</span><span className="text-zinc-600 text-[10px] uppercase">(PDF/Word)</span></div></>}
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="bg-card border border-[var(--border-time)] p-8 shadow-xl rounded-xl">
                                <h2 className="text-lg font-bold text-white font-mono uppercase tracking-tight mb-8 pb-4 border-b border-[var(--border-time)]">Skills & Expertise</h2>
                                <div className="space-y-8">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Add a new skill..."
                                            value={newSkill}
                                            onChange={(e) => setNewSkill(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter"}
                                            className="w-full pl-4 pr-16 py-4 bg-zinc-900 border border-[var(--border-time)] focus:border-white outline-none transition-all text-white font-mono text-sm placeholder:text-zinc-700 rounded-lg"
                                        />
                                        <button onClick={handleAddSkill} className="absolute right-2 top-2 bottom-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold uppercase rounded-md transition-colors">Add</button>
                                    </div>

                                    {skills.length === 0 ? (
                                        <div className="w-full py-8 text-center border-2 border-dashed border-[var(--border-time)] rounded-xl transition-colors">
                                            <p className="text-zinc-700 font-mono text-xs uppercase tracking-widest">No skills added</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {Object.entries(categorizedSkills).map(([category, categorySkills]) => (
                                                <div key={category} className="space-y-3">
                                                    <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{category}</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {categorySkills.map((skill) => (
                                                            <div key={skill} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-zinc-900/80 border border-[var(--border-time)] text-zinc-300 text-[10px] font-mono uppercase tracking-wide rounded-md hover:border-zinc-500 transition-all">
                                                                {skill}
                                                                <button onClick={() => handleRemoveSkill(skill)} className="p-0.5 hover:text-red-400 transition-colors"><X className="w-3 h-3" /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </motion.main>
    );
}
