"use client";

import { TeamGridSkeleton } from "@/components/shared/SkeletonLoader";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Users, ArrowRight, Hexagon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useInfiniteScrollTrigger } from "@/hooks/useInfiniteScrollTrigger";
import { useModalStore } from "@/hooks/useModalStore";
import { flattenInfiniteTeams, useInfiniteTeams } from "@/hooks/useTeams";

interface Team {
    id: string;
    name: string;
    desc?: string;
    leader?: { name: string };
    members?: unknown[];
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function TeamsClient() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const {
        data: paginatedTeams,
        isPending: isLoading,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
    } = useInfiniteTeams({ enabled: !!session, limit: 9 });
    const { openTeamModal } = useModalStore();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    const visibleTeams = useMemo(
        () => flattenInfiniteTeams(paginatedTeams).filter((team: Team) => team.name !== "Personal"),
        [paginatedTeams]
    );

    const teamsSentinelRef = useInfiniteScrollTrigger({
        hasMore: !!hasNextPage,
        isLoading: isFetchingNextPage,
        onLoadMore: () => {
            void fetchNextPage();
        },
    });

    const shouldShowSkeleton = status === "loading" || isLoading;
    if (!session && status !== "loading") return null;

    return (
        <motion.main
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="min-h-screen bg-background p-6 lg:p-12 text-zinc-900 dark:text-zinc-200 selection:bg-zinc-200 dark:selection:bg-zinc-800"
        >
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4 border-b border-[var(--border-time)] pb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Teams</h1>
                        <p className="text-zinc-500 text-sm mt-2">Manage your teams and members.</p>
                    </div>
                    <motion.button
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openTeamModal()}
                        className="group flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-black transition-all duration-200 font-medium text-sm overflow-hidden relative rounded-lg shadow-sm hover:shadow-md"
                    >
                        <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                        <span className="font-bold tracking-wide">Create Team</span>
                        <div className="hidden md:flex items-center gap-0.5 ml-1 px-1.5 py-0.5 bg-black/10 rounded text-[9px] font-mono">
                            <span>N</span>
                        </div>
                    </motion.button>
                </div>

                {shouldShowSkeleton ? (
                    <TeamGridSkeleton count={6} />
                ) : visibleTeams.length > 0 ? (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {visibleTeams.map((team: Team) => (
                            <motion.div
                                variants={itemVariants}
                                whileHover={{ y: -4 }}
                                whileTap={{ scale: 0.98 }}
                                key={team.id}
                                onClick={() => router.push(`/teams/${team.id}`)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        router.push(`/teams/${team.id}`);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                                className="group relative bg-card border border-[var(--border-time)] p-6 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-700 hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-300">
                                    <ArrowRight className="w-5 h-5 text-zinc-400" />
                                </div>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 border border-[var(--border-time)] flex items-center justify-center text-zinc-900 dark:text-zinc-300 font-bold text-lg group-hover:bg-zinc-200 dark:group-hover:bg-zinc-800 transition-colors rounded-lg">
                                        {team.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{team.name}</h3>
                                        <span className="text-[10px] uppercase tracking-wider text-zinc-500 border border-[var(--border-time)] px-1.5 py-0.5 rounded-sm">
                                            {team.leader?.name ? `Leader: ${team.leader.name}` : "No Leader"}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-zinc-500 text-sm mb-8 line-clamp-2 min-h-[40px] leading-relaxed">
                                    {team.desc || "No description available."}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-[var(--border-time)]">
                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                        <Users className="w-3.5 h-3.5" />
                                        <span>{team.members?.length || 0} Members</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                                        <Hexagon className="w-3 h-3 text-emerald-900 text-emerald-500/50" />
                                        Active
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {hasNextPage && <div ref={teamsSentinelRef} className="h-6 w-full md:col-span-2 lg:col-span-3" />}
                        {isFetchingNextPage && <div className="md:col-span-2 lg:col-span-3"><TeamGridSkeleton count={3} /></div>}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-[var(--border-time)] border-dashed p-12 flex flex-col items-center justify-center text-center max-w-lg mx-auto mt-10 bg-card rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group"
                    >
                        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 dark:text-zinc-600 mb-6 rounded-lg group-hover:bg-zinc-200 dark:group-hover:bg-zinc-800 transition-colors">
                            <Users className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No Teams Found</h3>
                        <p className="text-zinc-600 mb-8 text-sm">
                            You haven&apos;t created any teams yet. Start by creating one.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openTeamModal()}
                            className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-black font-bold text-sm tracking-wide transition-colors rounded-lg flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Create Team
                        </motion.button>
                    </motion.div>
                )}
            </div>
        </motion.main>
    );
}
