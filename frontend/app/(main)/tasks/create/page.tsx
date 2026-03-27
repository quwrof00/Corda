"use client";
import { LoadingBars } from "@/components/shared/LoadingBars";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useTeams } from "@/hooks/useTeams";
import { ArrowLeft, ListTodo } from "lucide-react";

export default function CreateTaskPage() {
    const router = useRouter();
    const { data: teams, isLoading: teamsLoading } = useTeams();

    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [deadline, setDeadline] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [requiredSkill, setRequiredSkill] = useState("");
    const [teamId, setTeamId] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post("/tasks", {
                title,
                description: desc,
                deadline: new Date(deadline),
                priority,
                requiredSkill,
                teamId,
            });

            // After task creation, trigger allocation immediately? 
            // User might want to assign manually?
            // For this app flow, we might rely on the 'allocator' later. 
            // But let's stick to simple creation first.

            router.push("/tasks");
        } catch (err) {
            console.error(err);
            alert("Failed to create task");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-[calc(100vh-64px)] bg-background p-6 md:p-10 flex justify-center">
            <div className="w-full max-w-2xl">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>

                <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
                    <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border">
                        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-foreground shadow-sm">
                            <ListTodo className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Create New Task</h1>
                            <p className="text-muted-foreground mt-1">Define a task to be allocated to your team</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-semibold text-foreground/80 mb-2">
                                Task Title
                            </label>
                            <input
                                type="text"
                                placeholder="Enter task"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground placeholder-muted-foreground"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-foreground/80 mb-2">
                                Description
                            </label>
                            <textarea
                                placeholder="Details about the task"
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground placeholder-muted-foreground resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Team Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-foreground/80 mb-2">
                                    Assign to Team
                                </label>
                                {teamsLoading ? (
                                    <div className="space-y-3">
                                        <SkeletonLoader rows={1} className="space-y-0" />
                                        <p className="text-xs text-muted-foreground">Loading available teams...</p>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <select
                                            value={teamId}
                                            onChange={(e) => setTeamId(e.target.value)}
                                            className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground appearance-none"
                                            required
                                        >
                                            <option value="" disabled>Select a team</option>
                                            {teams?.map((team: { id: string; name: string }) => (
                                                <option key={team.id} value={team.id}>
                                                    {team.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-muted-foreground">
                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Required Skill */}
                            <div>
                                <label className="block text-sm font-semibold text-foreground/80 mb-2">
                                    Required Skill
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. React, Python"
                                    value={requiredSkill}
                                    onChange={(e) => setRequiredSkill(e.target.value)}
                                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground placeholder-muted-foreground"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-semibold text-foreground/80 mb-2">
                                    Priority
                                </label>
                                <div className="relative">
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground appearance-none"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-muted-foreground">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                    </div>
                                </div>
                            </div>

                            {/* Deadline */}
                            <div>
                                <label className="block text-sm font-semibold text-foreground/80 mb-2">
                                    Deadline
                                </label>
                                <input
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground placeholder-muted-foreground [color-scheme:dark]"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-6 flex items-center justify-end gap-3 border-t border-border">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-3 rounded-xl border border-border text-foreground hover:bg-muted font-medium transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || teamsLoading}
                                className="px-8 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-[1px]"
                            >
                                {loading ? (
                                    <>
                                        <LoadingBars className="w-5 h-5" />
                                        Creating...
                                    </>
                                ) : "Create Task"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
