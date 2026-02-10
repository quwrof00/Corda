import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
    icon: LucideIcon;
    title: string;
    description: string;
    badge?: {
        text: string;
        color: "blue" | "green" | "purple" | "amber";
    };
    actions?: ReactNode;
    stats?: {
        label: string;
        value: string | number;
        color?: string;
    }[];
}

const badgeColors = {
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    green: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    purple: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
};

export function PageHeader({ icon: Icon, title, description, badge, actions, stats }: PageHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-900"
        >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                {/* Left side - Title and description */}
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                            <Icon className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
                        </div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                {title}
                            </h1>
                            {badge && (
                                <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md border ${badgeColors[badge.color]}`}>
                                    {badge.text}
                                </span>
                            )}
                        </div>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-2xl">
                        {description}
                    </p>

                    {/* Stats row */}
                    {stats && stats.length > 0 && (
                        <div className="flex items-center gap-6 mt-4">
                            {stats.map((stat, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        {stat.label}{" "}
                                        <span className={`font-bold ${stat.color || "text-zinc-900 dark:text-zinc-300"}`}>
                                            {stat.value}
                                        </span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right side - Actions */}
                {actions && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {actions}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
