import { motion } from "framer-motion";
import { LucideIcon, Plus } from "lucide-react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    variant?: "default" | "minimal";
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    variant = "default"
}: EmptyStateProps) {
    if (variant === "minimal") {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8 px-4 border border-dashed border-zinc-300 dark:border-zinc-900 rounded-xl bg-zinc-50 dark:bg-zinc-900/20 text-center flex flex-col items-center justify-center gap-2 group hover:border-zinc-400 dark:hover:border-zinc-800 transition-colors"
            >
                <p className="text-zinc-500 dark:text-zinc-600 text-xs">{description}</p>
                {actionLabel && onAction && (
                    <button
                        onClick={onAction}
                        className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors px-3 py-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800"
                    >
                        <Plus className="w-3 h-3" />
                        {actionLabel}
                    </button>
                )}
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 border border-zinc-200 dark:border-zinc-900 border-dashed bg-card/50 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-800 transition-colors group"
        >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-xl mb-4 group-hover:scale-105 transition-transform">
                <Icon className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
            </div>
            <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300 tracking-tight mb-2">
                {title}
            </h3>
            <p className="text-zinc-500 dark:text-zinc-600 mb-6 text-sm max-w-sm mx-auto">
                {description}
            </p>
            {actionLabel && onAction && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onAction}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black text-sm font-bold rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    {actionLabel}
                </motion.button>
            )}
        </motion.div>
    );
}
