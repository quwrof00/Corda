"use client";
import { LoadingBars } from "@/components/shared/LoadingBars";



import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckSquare, Users, LogOut, User, Terminal, Lock, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { usePersonalWorkspace } from "@/hooks/usePersonalWorkspace";
import { useUser } from "@/hooks/useUser";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import ConfirmModal from "./ConfirmModal";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { clsx } from "clsx";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { data: personalTeamId } = usePersonalWorkspace();
    // Cast to any to access custom session properties like id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userSession = session?.user as any;
    const userId = userSession?.id;

    const { data: user } = useUser(userId, { enabled: !!userId });

    const [logoutModalOpen, setLogoutModalOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Effect to update CSS variable for main content margin
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--sidebar-width', isCollapsed ? '5rem' : '16rem');
    }, [isCollapsed]);

    if (!session) return null;

    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "My Teams", href: "/teams", icon: Users },
        { name: "My Tasks", href: "/tasks", icon: CheckSquare },
    ];

    const sidebarVariants = {
        expanded: { width: "16rem" },
        collapsed: { width: "5rem" }
    };

    return (
        <motion.aside
            initial="expanded"
            animate={isCollapsed ? "collapsed" : "expanded"}
            variants={sidebarVariants}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="hidden md:flex fixed left-0 top-0 z-40 h-screen border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex-col justify-between font-mono"
        >
            <div className="bg-white dark:bg-zinc-950 flex flex-col h-full">
                {/* Logo & Toggle */}
                <div className="flex h-16 items-center px-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 relative shrink-0">
                    <div className="flex items-center gap-3 w-full overflow-hidden">
                        <div className="flex h-8 w-8 min-w-[2rem] items-center justify-center bg-zinc-950 dark:bg-white text-white dark:text-black font-bold border border-zinc-200 dark:border-zinc-500 rounded-md">
                            <Terminal className="w-5 h-5" />
                        </div>
                        <AnimatePresence>
                            <Link href="/dashboard">
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white uppercase whitespace-nowrap"
                                    >
                                        CORDA
                                    </motion.span>
                                )}
                            </Link>
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-zinc-900 border-2 border-white dark:border-zinc-800 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors z-50 shadow-sm"
                    >
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col py-4 gap-1 px-2">
                    {navItems.map((item) => {
                        const isPersonalWorkspace = item.href === "/teams" && personalTeamId && pathname === `/teams/${personalTeamId}`;
                        const isActive = pathname.startsWith(item.href) && !isPersonalWorkspace;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={clsx(
                                    "group flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all relative",
                                    isCollapsed ? "justify-center" : "",
                                    isActive
                                        ? "bg-[var(--accent-time)]/10 text-[var(--accent-time)]"
                                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                                )}
                                prefetch={false}
                                title={isCollapsed ? item.name : undefined}
                            >
                                <item.icon className={clsx("h-5 w-5 min-w-[1.25rem]", isActive ? "text-[var(--accent-time)]" : "text-zinc-600 group-hover:text-zinc-400")} />
                                <AnimatePresence>
                                    {!isCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: "auto" }}
                                            exit={{ opacity: 0, width: 0 }}
                                            className="whitespace-nowrap overflow-hidden"
                                        >
                                            {item.name}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                                {isActive && !isCollapsed && (
                                    <motion.div
                                        layoutId="activeNavIndicator"
                                        className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--accent-time)] rounded-l-full"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Personal Workspace - Separate Section */}
                <div className="mt-2 pt-4 border-t border-zinc-200 dark:border-zinc-900 px-2">
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.h3
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="px-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 whitespace-nowrap overflow-hidden"
                            >
                                Personal
                            </motion.h3>
                        )}
                    </AnimatePresence>

                    {personalTeamId ? (
                        <Link
                            href={`/teams/${personalTeamId}`}
                            className={clsx(
                                "group flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all relative",
                                isCollapsed ? "justify-center" : "",
                                pathname === `/teams/${personalTeamId}`
                                    ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white"
                                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                            )}
                            title={isCollapsed ? "My Workspace" : undefined}
                        >
                            <Lock className={clsx("h-4 w-4 min-w-[1rem]", pathname === `/teams/${personalTeamId}` ? "text-zinc-900 dark:text-white" : "text-zinc-600 group-hover:text-zinc-400")} />
                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: "auto" }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="whitespace-nowrap overflow-hidden"
                                    >
                                        My Workspace
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>
                    ) : (
                        <div className="px-3 py-3 flex items-center justify-center md:justify-start gap-2 text-zinc-700 text-xs">
                            <LoadingBars className="w-4 h-4 min-w-[1rem] rounded-full" />
                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: "auto" }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="whitespace-nowrap overflow-hidden"
                                    >
                                        Loading...
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                <div className="flex-1" />

                <div className="flex flex-col gap-2 p-2">
                    {/* Skills Warning */}
                    {user && (!user.skills || user.skills.length === 0) && (
                        <div className="pb-2">
                            <Link
                                href="/profile"
                                className={clsx(
                                    "flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all group overflow-hidden",
                                    isCollapsed ? "justify-center" : "justify-start"
                                )}
                                title={isCollapsed ? "Action Required: Add Skills" : undefined}
                            >
                                <AlertCircle className="w-4 h-4 min-w-[1rem] flex-shrink-0 animate-pulse" />
                                <AnimatePresence>
                                    {!isCollapsed && (
                                        <motion.div
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: "auto" }}
                                            exit={{ opacity: 0, width: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <p className="text-[10px] font-bold uppercase tracking-wider mb-1 whitespace-nowrap">Action Required</p>
                                            <p className="text-[10px] text-amber-500/80 leading-relaxed font-sans whitespace-nowrap">
                                                Add skills now
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Link>
                        </div>
                    )}

                    {/* Theme Switcher */}
                    <div className="border-t border-[var(--border-time)] py-4 mt-2">
                        <ThemeSwitcher isCollapsed={isCollapsed} />
                    </div>

                    {/* User Profile */}
                    <div className="border-t border-[var(--border-time)] pt-4 bg-white dark:bg-zinc-950">
                        <Link href="/profile" className={clsx("flex items-center gap-3 mb-4 cursor-pointer group hover:opacity-80 px-2", isCollapsed && "justify-center")}>
                            <div className="h-9 w-9 min-w-[2.25rem] bg-zinc-100 dark:bg-zinc-900 border border-[var(--border-time)] flex items-center justify-center relative rounded-full overflow-hidden">
                                {session.user?.image ? (
                                    <Image
                                        src={session.user.image}
                                        alt={session.user.name || "User"}
                                        fill
                                        sizes="36px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <User size={16} className="text-zinc-500" />
                                )}
                            </div>
                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.div
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: "auto" }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="flex-1 overflow-hidden"
                                    >
                                        <p className="truncate text-xs font-bold text-zinc-900 dark:text-zinc-200 uppercase">{session.user?.name}</p>
                                        <p className="truncate text-[10px] text-zinc-500 uppercase font-mono">ID: {session.user?.email?.split('@')[0]}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Link>

                        <button
                            onClick={() => setLogoutModalOpen(true)}
                            className={clsx(
                                "w-full flex items-center gap-2 py-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-500 uppercase tracking-wider border border-zinc-200 dark:border-zinc-800 hover:border-red-200 dark:hover:border-red-900 transition-colors rounded-lg",
                                isCollapsed ? "justify-center px-0" : "justify-center px-4"
                            )}
                            title={isCollapsed ? "Disconnect" : undefined}
                        >
                            <LogOut size={14} className="min-w-[0.875rem]" />
                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: "auto" }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="whitespace-nowrap overflow-hidden"
                                    >
                                        Sign Out
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={logoutModalOpen}
                onClose={() => setLogoutModalOpen(false)}
                onConfirm={() => signOut({ callbackUrl: "/login" })}
                title="Disconnect Session"
                description="Are you sure you want to terminate your current session? You will be redirected to the login terminal."
                confirmText="Terminate"
                variant="danger"
            />
        </motion.aside>
    );
}
