"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CheckSquare, Menu, Terminal, LogOut, X, Lock } from "lucide-react";
import { usePersonalWorkspace } from "@/hooks/usePersonalWorkspace";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { clsx } from "clsx";
import Image from "next/image";

export default function MobileNav() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { data: personalTeamId } = usePersonalWorkspace();
    const [isOpen, setIsOpen] = useState(false);

    if (!session) return null;

    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "My Teams", href: "/teams", icon: Users },
        { name: "My Tasks", href: "/tasks", icon: CheckSquare },
    ];

    return (
        <>
            {/* Top Bar */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-zinc-950 border-b border-zinc-800 z-50 flex items-center justify-between px-4 md:hidden font-mono">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center bg-white text-black font-bold border border-zinc-500 rounded-sm">
                        <Terminal className="w-5 h-5" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-white uppercase">CORDA</span>
                </div>

                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 text-zinc-400 hover:text-white"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </header>

            {/* Spacer for fixed header */}
            <div className="h-16 md:hidden" />

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-zinc-950 animate-in fade-in slide-in-from-right-10 duration-200 font-mono">
                    <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold tracking-tight text-white uppercase">Menu</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 text-zinc-400 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto py-4">
                        <nav className="flex flex-col">
                            {navItems.map((item) => {
                                const isActive = pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={clsx(
                                            "flex items-center gap-3 px-6 py-4 text-sm font-bold uppercase tracking-wider border-b border-zinc-900 hover:bg-zinc-900 transition-colors",
                                            isActive
                                                ? "bg-zinc-900 text-white border-l-4 border-l-emerald-500"
                                                : "text-zinc-500 hover:text-zinc-300"
                                        )}
                                    >
                                        <item.icon className={clsx("h-5 w-5", isActive ? "text-white" : "text-zinc-600")} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Personal Workspace */}
                        {personalTeamId && (
                            <div className="mt-6 pt-6 border-t border-zinc-900">
                                <h3 className="px-6 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Personal</h3>
                                <Link
                                    href={`/teams/${personalTeamId}`}
                                    onClick={() => setIsOpen(false)}
                                    className={clsx(
                                        "flex items-center gap-3 px-6 py-4 text-sm font-bold uppercase tracking-wider border-b border-zinc-900 hover:bg-zinc-900 transition-colors",
                                        pathname === `/teams/${personalTeamId}`
                                            ? "bg-zinc-900 text-white border-l-4 border-l-emerald-500"
                                            : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    <Lock className={clsx("h-5 w-5", pathname === `/teams/${personalTeamId}` ? "text-white" : "text-zinc-600")} />
                                    My Tasks
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                        <Link
                            href="/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 mb-4 p-2 -mx-2 hover:bg-zinc-800/50 rounded-lg transition-colors group"
                        >
                            <div className="h-10 w-10 bg-zinc-900 border border-zinc-700 flex items-center justify-center relative rounded-md overflow-hidden group-hover:border-zinc-500 transition-colors">
                                {session.user?.image ? (
                                    <Image
                                        src={session.user.image}
                                        alt={session.user.name || "User"}
                                        fill
                                        sizes="40px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <User size={16} className="text-zinc-500 group-hover:text-zinc-300" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-bold text-zinc-200 group-hover:text-white uppercase">{session.user?.name}</p>
                                <p className="truncate text-[10px] text-zinc-500 group-hover:text-zinc-400 uppercase">ID: {session.user?.email?.split('@')[0]}</p>
                            </div>
                        </Link>
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 hover:bg-red-950/20 hover:text-red-500 uppercase tracking-wider border border-zinc-800 hover:border-red-900 bg-zinc-950 rounded-lg transition-colors"
                        >
                            <LogOut size={14} />
                            <span>Disconnect</span>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

function User({ size, className }: { size: number, className: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}
