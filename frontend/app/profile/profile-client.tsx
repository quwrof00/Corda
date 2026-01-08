"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useUser, useUpdateUser } from "@/hooks/useUser";
import { Loader2, Plus, Save, User, X } from "lucide-react";
import { toast } from "sonner";

interface ProfileClientProps {
    initialUser: string;
    userId: string;
}

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

    // Sync skills when user data loads
    useEffect(() => {
        if (user) {
            setSkills(user.skills || []);
            setName(user.name || session?.user?.name || "");
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

    return (
        <main className="min-h-screen bg-background text-zinc-300 font-sans p-6 lg:p-12 mb-20 selection:bg-zinc-800">
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

                    {/* Right Column: Skills */}
                    <div className="lg:col-span-2">
                        <div className="bg-card border border-zinc-900 p-8 shadow-xl rounded-xl h-full">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-900">
                                <div>
                                    <h2 className="text-lg font-bold text-white font-mono uppercase tracking-tight">Technical Capabilities</h2>
                                    <p className="text-zinc-500 text-xs mt-1">Manage specialized skillsets for auto-allocation protocols.</p>
                                </div>
                                {isEditing && (
                                    <button
                                        onClick={handleSave}
                                        disabled={updateUserMutation.isPending}
                                        className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-zinc-200 text-black rounded-lg shadow-sm transition-all text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                                    >
                                        {updateUserMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                        Save Data
                                    </button>
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
                                    <button
                                        onClick={handleAddSkill}
                                        className="absolute right-2 top-2 bottom-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase rounded-md transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>

                                {/* Skills Grid */}
                                <div>
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Registered Capabilities</h3>

                                    <div className="flex flex-wrap gap-3">
                                        {skills.map((skill, index) => (
                                            <div key={index} className="group flex items-center gap-2 pl-3 pr-2 py-1.5 bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-xs font-mono uppercase tracking-wide rounded-md hover:border-zinc-600 transition-all">
                                                {skill}
                                                <button
                                                    onClick={() => handleRemoveSkill(skill)}
                                                    className="p-0.5 hover:bg-zinc-800 hover:text-red-400 rounded transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        {skills.length === 0 && (
                                            <div className="w-full py-8 text-center border-2 border-dashed border-zinc-900 rounded-xl">
                                                <p className="text-zinc-700 font-mono text-xs uppercase">No capabilities registered</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
