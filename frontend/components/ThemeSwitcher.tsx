"use client";

import { useThemeStore, ThemeType } from "@/store/useThemeStore";
import { Coffee, Mountain, Trees, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function ThemeSwitcher({ isCollapsed }: { isCollapsed?: boolean }) {
    const { theme, setTheme } = useThemeStore();

    const themes: { id: ThemeType; name: string; icon: any; color: string }[] = [
        { id: "auto", name: "Auto", icon: Zap, color: "bg-zinc-500" },
        { id: "coffee", name: "Coffee", icon: Coffee, color: "bg-amber-700" },
        { id: "mountains", name: "Mountains", icon: Mountain, color: "bg-blue-600" },
        { id: "hills", name: "Hills", icon: Trees, color: "bg-emerald-700" },
    ];

    if (isCollapsed) {
        const activeTheme = themes.find(t => t.id === theme) || themes[0];
        return (
            <div className="flex flex-col items-center gap-2 py-2">
                <button
                    onClick={() => {
                        const nextIndex = (themes.findIndex(t => t.id === theme) + 1) % themes.length;
                        setTheme(themes[nextIndex].id);
                    }}
                    className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 transition-all hover:bg-zinc-200 dark:hover:bg-zinc-800"
                    title={`Current: ${activeTheme.name}. Click to cycle.`}
                >
                    <activeTheme.icon className="w-4 h-4 text-[var(--accent-time)]" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 p-2 bg-zinc-100/50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 mx-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-2 mb-1">App Theme</h4>
            <div className="flex items-center gap-1">
                {themes.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={cn(
                            "relative p-2 rounded-lg transition-all group",
                            theme === t.id
                                ? "bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700"
                                : "hover:bg-zinc-200 dark:hover:bg-zinc-800/50"
                        )}
                        title={t.name}
                    >
                        <t.icon className={cn(
                            "w-4 h-4 transition-colors",
                            theme === t.id ? "text-[var(--accent-time)]" : "text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                        )} />
                        {theme === t.id && (
                            <motion.div
                                layoutId="activeTheme"
                                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[var(--accent-time)] rounded-full"
                            />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
