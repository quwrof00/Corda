"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useUpdateUser } from "@/hooks/useUser";
import { Loader2, Plus, Save, User, X, FileUp, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface ProfileClientProps {
    initialUser: {
        id: string;
        name: string | null;
        email: string | null;
        skills: string[];
        workload: number;
        role: string | null;
        resumeUrl: string | null;
        teams: { id: string; name: string }[];
    } | null;
    userId: string;
}

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

    // Remove empty categories
    return Object.fromEntries(
        Object.entries(categorized).filter(([, skills]) => skills.length > 0)
    );
};

export default function ProfileClient({ initialUser, userId }: ProfileClientProps) {
    const { data: session } = useSession();

    // Use initialData so it's available immediately
    const { data: user } = useUser(userId, {
        initialData: initialUser
    });


    const updateUserMutation = useUpdateUser();

    const [skills, setSkills] = useState<string[]>([]);
    const [name, setName] = useState("");
    const [newSkill, setNewSkill] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<"IDLE" | "UPLOADING" | "PARSING" | "EXTRACTING" | "COMPLETE">("IDLE");
    const [resumeUrl, setResumeUrl] = useState<string | null>(null);
    const [showAllSkills, setShowAllSkills] = useState(false);

    // Sync skills when user data loads
    useEffect(() => {
        if (user) {
            setSkills(user.skills || []);
            setName(user.name || session?.user?.name || "");
            setResumeUrl((user.resumeUrl as string | null) ?? null);
        }
    }, [user, session]);

    const handleAddSkill = () => {
        if (newSkill.trim() && !skills.includes(newSkill.trim())) {
            const updatedSkills = [...skills, newSkill.trim()];
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
            { id: userId, data: { skills, name } },
            {
                onSuccess: () => {
                    setIsEditing(false);
                    toast.success("Personnel record updated successfully");
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

        // Validate file type
        const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Only PDF and Word documents are allowed");
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB");
            return;
        }

        setUploadStatus("UPLOADING");

        try {
            // Simulated progress for better UX since fetch doesn't support progress events easily
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

            if (!response.ok) {
                throw new Error("Upload failed");
            }

            const data = await response.json();
            setResumeUrl(data.resumeUrl);

            setUploadStatus("COMPLETE");
            setTimeout(() => setUploadStatus("IDLE"), 1000);

            // Update skills if any were found
            if (data.allSkills && data.allSkills.length > 0) {
                setSkills(data.allSkills);
                setIsEditing(true);
                if (data.extractedSkills && data.extractedSkills.length > 0) {
                    toast.success(`Resume uploaded. Extracted ${data.extractedSkills.length} new skills!`);
                } else {
                    toast.success("Resume uploaded successfully");
                }
            } else {
                toast.success("Resume uploaded successfully");
            }
        } catch (error) {
            console.error("Resume upload error:", error);
            toast.error("Failed to upload resume");
            setUploadStatus("IDLE");
        }
    };

    const handleResumeDelete = async () => {
        if (!resumeUrl) return;

        setUploadStatus("UPLOADING"); // Reusing for delete loading state

        try {
            const response = await fetch(`/api/users/${userId}/resume`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Delete failed");
            }

            setResumeUrl(null);
            toast.success("Resume deleted successfully");
        } catch (error) {
            console.error("Resume delete error:", error);
            toast.error("Failed to delete resume");
        } finally {
            setUploadStatus("IDLE");
        }
    };

    const categorizedSkills = categorizeSkills(skills);
    const totalSkills = skills.length;
    const visibleSkillsLimit = 4;

    return (
        <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-background text-zinc-300 font-sans p-6 lg:p-12 mb-20 selection:bg-zinc-800"
        >
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-zinc-900">
                    <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white rounded-xl shadow-lg">
                        <User className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white uppercase tracking-tight font-mono">Personnel File</h1>
                        <p className="text-zinc-500 text-xs font-mono uppercase mt-1">ID: {userId?.substring(0, 8)}...</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Identity Card */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-card border border-zinc-900 p-6 shadow-xl rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-zinc-900/50 -mr-10 -mt-10 rounded-full blur-2xl"></div>

                            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 font-mono border-b border-zinc-900 pb-2">Identity</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] uppercase text-zinc-600 font-bold block mb-1">Designation</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            className="bg-transparent text-white font-bold text-lg w-full border-b border-zinc-800 focus:border-white outline-none pb-1 font-mono"
                                            value={name}
                                            onChange={(e) => {
                                                setName(e.target.value);
                                                setIsEditing(true);
                                            }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-zinc-600 font-bold block mb-1">Comms ID</label>
                                    <p className="text-zinc-400 font-mono text-sm">{user?.email || session?.user?.email}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-zinc-600 font-bold block mb-1">Clearance Level</label>
                                    <div className="inline-flex items-center px-2 py-1 bg-emerald-950/30 border border-emerald-900/50 rounded text-emerald-500 text-xs font-bold uppercase tracking-wider">
                                        Active Duty
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-zinc-900 p-6 shadow-xl rounded-xl">
                            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 font-mono border-b border-zinc-900 pb-2">Metrics</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-center">
                                    <span className="block text-2xl font-bold text-white mb-1">{user?.teams?.length || 0}</span>
                                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Units Assigned</span>
                                </div>
                                <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-center">
                                    <span className="block text-2xl font-bold text-white mb-1">{user?.workload || 0}%</span>
                                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Workload</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Resume & Skills */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Resume Upload Section - PRIORITY */}
                        <div className="bg-card border border-zinc-900 p-8 shadow-xl rounded-xl">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-900">
                                <div>
                                    <h2 className="text-lg font-bold text-white font-mono uppercase tracking-tight">Resume Upload</h2>
                                    <p className="text-zinc-500 text-xs mt-1">Upload your resume to auto-extract technical capabilities</p>
                                </div>
                            </div>

                            {resumeUrl ? (
                                <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <FileUp className="w-5 h-5 text-emerald-500" />
                                        <div>
                                            <p className="text-white text-sm font-mono">Resume Uploaded</p>
                                            <a
                                                href={resumeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-zinc-500 text-xs hover:text-white transition-colors"
                                            >
                                                View Document
                                            </a>
                                        </div>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleResumeDelete}
                                        disabled={uploadStatus !== "IDLE"}
                                        className="flex items-center gap-2 px-3 py-2 bg-red-950/30 hover:bg-red-950/50 border border-red-900/50 text-red-400 rounded-md text-xs font-bold uppercase transition-colors disabled:opacity-50"
                                    >
                                        {uploadStatus !== "IDLE" ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-3 h-3" />
                                        )}
                                        Delete
                                    </motion.button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="resume-upload"
                                        accept=".pdf,.doc,.docx"
                                        onChange={handleResumeUpload}
                                        disabled={uploadStatus !== "IDLE"}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="resume-upload"
                                        className={`flex items-center justify-center gap-3 p-8 bg-zinc-900 border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 rounded-lg cursor-pointer transition-all ${uploadStatus !== "IDLE" ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {uploadStatus !== "IDLE" ? (
                                            <>
                                                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                                                <span className="text-emerald-500 text-sm font-mono uppercase">Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <FileUp className="w-6 h-6 text-emerald-500" />
                                                <div className="text-center">
                                                    <span className="text-white text-base font-mono uppercase block">Click to Upload Resume</span>
                                                    <span className="text-zinc-600 text-xs">(PDF, DOC, DOCX - Max 5MB)</span>
                                                </div>
                                            </>
                                        )}
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Skills Section */}
                        <div className="bg-card border border-zinc-900 p-8 shadow-xl rounded-xl">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-900">
                                <div>
                                    <h2 className="text-lg font-bold text-white font-mono uppercase tracking-tight">Technical Capabilities</h2>
                                    <p className="text-zinc-500 text-xs mt-1">Manage specialized skillsets for auto-allocation protocols.</p>
                                </div>
                                {isEditing && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSave}
                                        disabled={updateUserMutation.isPending}
                                        className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-zinc-200 text-black rounded-lg shadow-sm transition-all text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                                    >
                                        {updateUserMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                        Save Data
                                    </motion.button>
                                )}
                            </div>

                            <div className="space-y-8">
                                {/* Input Area */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Plus className="h-4 w-4 text-zinc-600" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="INPUT NEW CAPABILITY (E.G. REACT, INFILTRATION...)"
                                        value={newSkill}
                                        onChange={(e) => setNewSkill(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                                        className="w-full pl-10 pr-4 py-4 bg-zinc-900 border border-zinc-800 focus:border-white focus:ring-1 focus:ring-white outline-none transition-all text-white font-mono text-sm placeholder:text-zinc-700 rounded-lg"
                                    />
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleAddSkill}
                                        className="absolute right-2 top-2 bottom-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase rounded-md transition-colors"
                                    >
                                        Add
                                    </motion.button>
                                </div>

                                {/* Skills Grid - Categorized */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Registered Capabilities ({totalSkills})</h3>
                                        {totalSkills > visibleSkillsLimit && (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setShowAllSkills(!showAllSkills)}
                                                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
                                            >
                                                {showAllSkills ? (
                                                    <>Show Less <ChevronUp className="w-3 h-3" /></>
                                                ) : (
                                                    <>Show All <ChevronDown className="w-3 h-3" /></>
                                                )}
                                            </motion.button>
                                        )}
                                    </div>

                                    {skills.length === 0 ? (
                                        <div className="w-full py-8 text-center border-2 border-dashed border-zinc-900 rounded-xl">
                                            <p className="text-zinc-700 font-mono text-xs uppercase">No capabilities registered</p>
                                            <p className="text-zinc-800 text-xs mt-2">Upload a resume or add skills manually</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <AnimatePresence mode="popLayout">
                                                {Object.entries(categorizedSkills).map(([category, categorySkills]) => {
                                                    const displaySkills = showAllSkills ? categorySkills : categorySkills.slice(0, visibleSkillsLimit);

                                                    return (
                                                        <motion.div
                                                            key={category}
                                                            layout
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="space-y-3"
                                                        >
                                                            <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">{category}</h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                <AnimatePresence mode="popLayout">
                                                                    {displaySkills.map((skill) => (
                                                                        <motion.div
                                                                            layout
                                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                                            animate={{ opacity: 1, scale: 1 }}
                                                                            exit={{ opacity: 0, scale: 0.8 }}
                                                                            key={skill}
                                                                            className="group flex items-center gap-2 pl-3 pr-2 py-1.5 bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-xs font-mono uppercase tracking-wide rounded-md hover:border-zinc-600 transition-all"
                                                                        >
                                                                            {skill}
                                                                            <motion.button
                                                                                whileHover={{ scale: 1.2 }}
                                                                                whileTap={{ scale: 0.9 }}
                                                                                onClick={() => handleRemoveSkill(skill)}
                                                                                className="p-0.5 hover:bg-zinc-800 hover:text-red-400 rounded transition-colors"
                                                                            >
                                                                                <X className="w-3 h-3" />
                                                                            </motion.button>
                                                                        </motion.div>
                                                                    ))}
                                                                </AnimatePresence>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Processing Overlay */}
            {
                uploadStatus !== "IDLE" && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center relative overflow-hidden">
                            {/* Animated Background Effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-transparent to-transparent opacity-50 animate-pulse" />

                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-20 h-20 bg-zinc-950 rounded-full flex items-center justify-center border-2 border-emerald-500/30 mb-6 relative">
                                    <div className="absolute inset-0 border-t-2 border-emerald-500 rounded-full animate-spin" />
                                    <div className="absolute inset-2 border-b-2 border-emerald-500/50 rounded-full animate-spin [animation-duration:1.5s]" />
                                    {uploadStatus === "COMPLETE" ? (
                                        <div className="w-8 h-8 bg-emerald-500 rounded-full animate-pulse" />
                                    ) : (
                                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-white uppercase font-mono tracking-wider mb-2">
                                    {uploadStatus === "UPLOADING" && "Uploading Data"}
                                    {uploadStatus === "PARSING" && "Parsing Document"}
                                    {uploadStatus === "EXTRACTING" && "Analyzing Skills"}
                                    {uploadStatus === "COMPLETE" && "Analysis Complete"}
                                </h3>
                                <p className="text-zinc-400 text-sm mb-6 max-w-xs mx-auto animate-pulse">
                                    {uploadStatus === "UPLOADING" && "Encrypting and transferring file..."}
                                    {uploadStatus === "PARSING" && "Extracting raw text from document..."}
                                    {uploadStatus === "EXTRACTING" && "Identifying technical capabilities..."}
                                    {uploadStatus === "COMPLETE" && "Skills successfully identified."}
                                </p>

                                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                                        style={{
                                            width: uploadStatus === "UPLOADING" ? '30%' :
                                                uploadStatus === "PARSING" ? '60%' :
                                                    uploadStatus === "EXTRACTING" ? '85%' : '100%'
                                        }}
                                    />
                                </div>
                                <p className="text-zinc-500 text-[10px] uppercase font-mono mt-4 tracking-widest">
                                    Do not close window
                                </p>
                            </div>
                        </div>
                    </div>
                )
            }
        </motion.main>
    );
}
