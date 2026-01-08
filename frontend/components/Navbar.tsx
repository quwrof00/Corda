"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, ListTodo, LogOut, User, Users } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    if (!session || pathname === "/") return null; // Don't show navbar if not logged in (or handle differently)

    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Teams", href: "/teams", icon: Users },
        { name: "Tasks", href: "/tasks", icon: ListTodo },
    ];

    return (
        <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-md group-hover:shadow-lg transition-all">
                            T
                        </div>
                        <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-400">
                            TaskAllo
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-6">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                                <item.icon className="w-4 h-4" />
                                {item.name}
                            </Link>
                        ))}
                    </div>

                    {/* User Profile & Logout */}
                    <div className="hidden md:flex items-center gap-4 pl-6 border-l border-slate-200 dark:border-slate-800">
                        <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity" title="View Profile">
                            <div className="text-right hidden lg:block">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">
                                    {session.user?.name || "User"}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {session.user?.email}
                                </p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 overflow-hidden relative">
                                {session.user?.image ? (
                                    <Image
                                        src={session.user.image}
                                        alt="Avatar"
                                        fill
                                        sizes="32px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <User className="w-4 h-4" />
                                )}
                            </div>
                        </Link>

                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full transition-colors"
                            title="Sign Out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-slate-600 dark:text-slate-300"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                    <div className="flex items-center gap-3 mb-6 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center relative overflow-hidden">
                            {session.user?.image ? (
                                <Image
                                    src={session.user.image}
                                    alt="Avatar"
                                    fill
                                    sizes="40px"
                                    className="rounded-full object-cover"
                                />
                            ) : (
                                <User className="w-5 h-5" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {session.user?.name || "User"}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {session.user?.email}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        ))}
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors mt-4"
                        >
                            <LogOut className="w-5 h-5" />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}
