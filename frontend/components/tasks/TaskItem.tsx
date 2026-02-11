import { motion } from "framer-motion";
import { Check, ChevronRight, Plus, ArrowRight, Calendar, Repeat } from "lucide-react";
import { Task } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";

interface TaskItemProps {
    task: Task & { level?: number };
    onSelect: (task: Task) => void;
    onQuickComplete?: (e: React.MouseEvent, task: Task) => void;
    onToggleExpand?: (taskId: string, e: React.MouseEvent) => void;
    onAddSubtask?: (taskId: string, teamId: string, e: React.MouseEvent) => void;
    isExpanded?: boolean;
    variant?: "dashboard" | "list" | "personal";
    showTeamBadge?: boolean;
    showStatus?: boolean;
    showDeadline?: boolean;
    formatDaysLeft?: (dateString?: string) => string;
    loading?: boolean;
}

export function TaskItem({
    task,
    onSelect,
    onQuickComplete,
    onToggleExpand,
    onAddSubtask,
    isExpanded = false,
    variant = "dashboard",
    showTeamBadge = true,
    showStatus = true,
    showDeadline = true,
    formatDaysLeft,
    loading = false
}: TaskItemProps) {
    const hasChildren = task.children && task.children.length > 0;
    const level = task.level || 0;

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            layout
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            key={task.id}
            className={cn(
                "group relative flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer",
                task.source === 'moodle'
                    ? "bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-950/30 dark:to-transparent border-orange-200/80 dark:border-orange-800/50 hover:from-orange-100/50 dark:hover:from-orange-900/50"
                    : "bg-card border-zinc-200 dark:border-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/30",
                level > 0 && "border-l-4 border-l-zinc-300 dark:border-l-zinc-800",
                task.status === 'completed' && "opacity-60",
                variant === "dashboard" && "hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50"
            )}
            style={{ marginLeft: level > 0 ? `${level * 1.5}rem` : 0 }}
            whileHover={{ y: variant === "dashboard" ? -2 : 0, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(task)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelect(task);
            }}
        >
            {/* Status Indicator Bar */}
            <div className={cn("absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-colors",
                task.status === 'completed' ? "bg-emerald-500" :
                    task.priority === 'High' ? "bg-red-500" : "bg-zinc-700 group-hover:bg-zinc-500"
            )} />

            {/* Completion Indicator or Quick Complete Action */}
            {onQuickComplete && (
                task.status === 'completed' ? (
                    <button
                        className="ml-3 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center z-10 hover:bg-emerald-600 transition-colors cursor-pointer disabled:opacity-50"
                        onClick={(e) => onQuickComplete(e, task)}
                        disabled={loading}
                        title="Mark as Incomplete"
                    >
                        <Check className="w-3 h-3 text-white" />
                    </button>
                ) : (
                    <button
                        className="ml-3 h-5 w-5 rounded-full border-2 border-zinc-700 flex items-center justify-center text-zinc-400 hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all z-10 cursor-pointer disabled:opacity-50"
                        onClick={(e) => onQuickComplete(e, task)}
                        disabled={loading}
                        title="Mark as Completed"
                    >
                    </button>
                )
            )}

            {/* Chevron between checkbox and title */}
            {hasChildren && onToggleExpand && (
                <button
                    onClick={(e) => onToggleExpand(task.id, e)}
                    className="flex-shrink-0 p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
                    title={isExpanded ? "Collapse" : "Expand"}
                >
                    <ChevronRight className={cn("w-3.5 h-3.5 text-zinc-500 transition-transform duration-200", isExpanded && "rotate-90")} />
                </button>
            )}

            {/* Content */}
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    {showTeamBadge && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800">
                            {task.team?.name || "Unassigned"}
                        </span>
                    )}
                    {task.priority === 'High' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" title="High Priority" />
                    )}
                </div>
                <h3 className={cn(
                    "font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white transition-colors",
                    task.status === 'completed' && "line-through text-zinc-500"
                )}>
                    {task.title}
                </h3>
            </div>

            <div className="flex items-center gap-6 text-sm text-zinc-500">
                {task.recurrenceId && (
                    <span className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 text-[10px] font-bold uppercase tracking-wider transition-colors">
                        <Repeat className="w-3 h-3" />
                        Recurring
                    </span>
                )}
                {showDeadline && task.deadline && formatDaysLeft && (
                    <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900/50 border border-transparent group-hover:border-zinc-200 dark:group-hover:border-zinc-800 transition-colors text-xs font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDaysLeft(task.deadline)}
                    </span>
                )}
                {showStatus && (
                    <span className={cn(
                        "hidden sm:flex px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border",
                        task.status === "active" || task.status === "in-progress"
                            ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30"
                            : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800"
                    )}>
                        {task.status === 'pending' || task.status === 'to-do' ? 'To Do' :
                            task.status === 'active' || task.status === 'in-progress' ? 'In Progress' :
                                task.status.replace('-', ' ')}
                    </span>
                )}
            </div>

            {/* Add Subtask Button - Shows on hover */}
            {onAddSubtask && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddSubtask(task.id, task.teamId || "", e);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md"
                    title="Add Subtask"
                >
                    <Plus className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                </button>
            )}

            {variant === "dashboard" && (
                <ArrowRight className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            )}
        </motion.div>
    );
}
