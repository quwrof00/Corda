"use client";

import { useTeams } from "@/hooks/useTeams";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Users, ArrowRight, RefreshCw, Hexagon } from "lucide-react";
import { useEffect, useState } from "react";
import CreateTeamModal from "@/components/CreateTeamModal";

interface Team {
    id: string;
    name: string;
    desc?: string;
    leader?: { name: string };
    members?: unknown[];
}

// @ts-expect-error: initialData typing is complex
export default function TeamsClient({ initialTeams }) {
    const { status } = useSession();
    const router = useRouter();
    const { data: teams, isLoading, refetch: refreshTeams } = useTeams({ initialData: initialTeams });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    if (status === "loading" || isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-background">
                <div className="flex flex-col items-center gap-4 text-zinc-500 text-sm">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span>Loading Teams...</span>
                </div>
            </div>
        );
    }

    const visibleTeams = teams?.filter((t: Team) => t.name !== "Personal") || [];

    return (
        <main className="min-h-screen bg-background p-6 lg:p-12 text-zinc-200 selection:bg-zinc-800">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4 border-b border-zinc-900 pb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Teams</h1>
                        <p className="text-zinc-500 text-sm mt-2">Manage your teams and members.</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="group flex items-center gap-2 px-5 py-2.5 bg-zinc-100 hover:bg-white text-black transition-all duration-200 font-medium text-sm overflow-hidden relative rounded-lg"
                    >
                        <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                        <span className="font-bold tracking-wide">Create Team</span>
                    </button>
                </div>

                {visibleTeams.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {visibleTeams.map((team: Team) => (
                            <div
                                key={team.id}
                                onClick={() => router.push(`/teams/${team.id}`)}
                                className="group relative bg-card border border-zinc-900 p-6 hover:border-zinc-700 transition-all cursor-pointer overflow-hidden rounded-xl"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-300">
                                    <ArrowRight className="w-5 h-5 text-zinc-400" />
                                </div>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 font-bold text-lg group-hover:bg-zinc-800 transition-colors rounded-lg">
                                        {team.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-zinc-100 tracking-tight">{team.name}</h3>
                                        <span className="text-[10px] uppercase tracking-wider text-zinc-600 border border-zinc-800 px-1.5 py-0.5 rounded-sm">
                                            {team.leader?.name ? `Leader: ${team.leader.name}` : "No Leader"}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-zinc-500 text-sm mb-8 line-clamp-2 min-h-[40px] leading-relaxed">
                                    {team.desc || "No description available."}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                        <Users className="w-3.5 h-3.5" />
                                        <span>{team.members?.length || 0} Members</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                                        <Hexagon className="w-3 h-3 text-emerald-900 text-emerald-500/50" />
                                        Active
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="border border-zinc-900 border-dashed p-12 flex flex-col items-center justify-center text-center max-w-lg mx-auto mt-10 bg-card rounded-xl">
                        <div className="w-16 h-16 bg-zinc-900 flex items-center justify-center text-zinc-600 mb-6 rounded-lg">
                            <Users className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Teams Found</h3>
                        <p className="text-zinc-600 mb-8 text-sm">
                            You haven&apos;t created any teams yet. Start by creating one.
                        </p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-6 py-3 bg-zinc-100 hover:bg-white text-black font-bold text-sm tracking-wide transition-colors rounded-lg"
                        >
                            Create Team
                        </button>
                    </div>
                )}
            </div>

            <CreateTeamModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onTeamCreated={refreshTeams}
            />
        </main>
    );
}
