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
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col justify-between p-0 font-mono">
            <div>
                {/* Logo */}
                <div className="flex h-16 items-center gap-3 px-6 border-b border-zinc-800 bg-zinc-950">
                    <div className="flex h-8 w-8 items-center justify-center bg-white text-black font-bold border border-zinc-500">
                        <Terminal className="w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white uppercase">CORDA</span>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={clsx(
                                    "group flex items-center gap-3 px-6 py-4 text-xs font-bold uppercase tracking-wider border-b border-zinc-800/50 hover:bg-zinc-900 transition-none",
                                    isActive
                                        ? "bg-zinc-900 text-white border-r-4 border-r-white"
                                        : "text-zinc-500 hover:text-zinc-300"
                                )}
                                prefetch={false}
                            >
                                <item.icon className={clsx("h-4 w-4", isActive ? "text-white" : "text-zinc-600 group-hover:text-zinc-400")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* User Profile */}
            <div className="border-t border-zinc-800 p-6 bg-zinc-950">
                <Link href="/profile" className="flex items-center gap-3 mb-4 cursor-pointer group hover:opacity-80">
                    <div className="h-10 w-10 bg-zinc-900 border border-zinc-700 flex items-center justify-center relative">
                        {session.user?.image ? (
                            <Image
                                src={session.user.image}
                                alt={session.user.name || "User"}
                                fill
                                sizes="40px"
                                className="object-cover"
                            />
                        ) : (
                            <User size={16} className="text-zinc-500" />
                        )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate text-xs font-bold text-zinc-200 uppercase">{session.user?.name}</p>
                        <p className="truncate text-[10px] text-zinc-500 uppercase font-mono">ID: {session.user?.email?.split('@')[0]}</p>
                    </div>
                </Link>

                <button
                    onClick={() => setLogoutModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 hover:bg-red-950/20 hover:text-red-500 uppercase tracking-wider border border-zinc-800 hover:border-red-900 transition-none"
                >
                    <LogOut size={14} />
                    <span>Disconnect</span>
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
