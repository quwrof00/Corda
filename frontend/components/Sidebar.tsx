"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckSquare, Users, LogOut, User, Terminal } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import ConfirmModal from "./ConfirmModal";
import { clsx } from "clsx";
import Image from "next/image";

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);

    if (!session) return null;

    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "My Teams", href: "/teams", icon: Users },
        { name: "My Tasks", href: "/tasks", icon: CheckSquare },
    ];

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-900 bg-[#0c0c0c] transition-transform max-md:-translate-x-full flex flex-col justify-between py-6 px-4 font-mono">
            <div>
                {/* Logo */}
                <div className="flex px-2 mb-10 items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center bg-white text-black font-bold shadow-sm rounded-none border border-zinc-500">
                        <Terminal className="w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white uppercase">CORDA</span>
                </div>

                {/* Navigation */}
                <nav className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={clsx(
                                    "group flex items-center gap-3 px-3 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 border-l-2",
                                    isActive
                                        ? "bg-zinc-900 border-white text-white"
                                        : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 hover:border-zinc-700"
                                )}
                                prefetch
                            >
                                <item.icon className={clsx("h-4 w-4", isActive ? "text-white" : "text-zinc-600 group-hover:text-zinc-400")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* User Profile */}
            <div className="border-t border-zinc-900 pt-6">
                <Link href="/profile" className="flex items-center gap-3 px-2 py-2 mb-4 hover:bg-zinc-900/50 rounded-lg transition-colors cursor-pointer group">
                    <div className="h-8 w-8 overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-zinc-600 transition-colors relative">
                        {session.user?.image ? (
                            <Image
                                src={session.user.image}
                                alt={session.user.name || "User"}
                                fill
                                sizes="32px"
                                className="object-cover"
                            />
                        ) : (
                            <User size={14} className="text-zinc-500 group-hover:text-zinc-300" />
                        )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate text-xs font-bold text-zinc-300 uppercase group-hover:text-white transition-colors">{session.user?.name}</p>
                        <p className="truncate text-[10px] text-zinc-600 uppercase group-hover:text-zinc-500 transition-colors">Id: {session.user?.email?.split('@')[0]}</p>
                    </div>
                </Link>

                <button
                    onClick={() => setLogoutModalOpen(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-zinc-500 hover:bg-red-950/20 hover:text-red-500 transition-colors uppercase tracking-wider border border-transparent hover:border-red-900/50"
                >
                    <LogOut size={14} />
                    <span>Log Out</span>
                </button>
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
        </aside>
    );
}
