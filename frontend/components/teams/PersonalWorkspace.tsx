import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Task } from "./types";
import { cn, formatDaysLeft } from "./utils";
import { useInfiniteScrollTrigger } from "@/hooks/useInfiniteScrollTrigger";
import { CheckCircle2, Plus, ChevronRight, Repeat } from "lucide-react";
import { buildTaskTree, flattenTree } from "@/lib/taskTreeUtils";
import { useUpdateTask } from "@/hooks/useTasks";
import { useModalStore } from "@/hooks/useModalStore";
import MoodleSyncButton from "@/components/tasks/moodle-sync-button";

interface PersonalWorkspaceProps {
    assignedTasks: Task[];
    currentUserMemberId?: string;
    openEditTask: (task: Task) => void;
    hasMoreTasks: boolean;
    isFetchingMoreTasks: boolean;
    onLoadMoreTasks: () => void;
}

export function PersonalWorkspace({
    assignedTasks,
    currentUserMemberId,
    openEditTask,
    hasMoreTasks,
    isFetchingMoreTasks,
    onLoadMoreTasks,
}: PersonalWorkspaceProps) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const updateTaskMutation = useUpdateTask();
    const { openTaskModal } = useModalStore();

    const handleToggleExpand = (taskId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }
            return next;
        });
    };

    const handleStatusToggle = async (e: React.MouseEvent, task: Task) => {
        e.stopPropagation();
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';

        try {
            await updateTaskMutation.mutateAsync({ id: task.id, status: newStatus });
        } catch (err) {
            console.error("Failed to update task", err);
        }
    };

    // Build tree and flatten for rendering
    const tasksToRender = useMemo(() => {
        const tree = buildTaskTree(assignedTasks);
        return flattenTree(tree, expandedIds);
    }, [assignedTasks, expandedIds]);

    const scrollRootRef = useRef<HTMLDivElement>(null);
    
    const sentinelRef = useInfiniteScrollTrigger({
        hasMore: hasMoreTasks,
        isLoading: isFetchingMoreTasks,
        onLoadMore: onLoadMoreTasks,
        rootRef: scrollRootRef,
    });

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

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
        >
            {/* Stats Row */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-32 relative overflow-hidden group"
                >
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Pending Tasks</span>
                    <div>
                        <span className="text-4xl font-bold text-zinc-900 dark:text-white">{assignedTasks.filter(t => t.status !== 'completed').length}</span>
                        <span className="text-zinc-500 text-xs ml-1">tasks</span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-amber-500 h-full" style={{ width: `${(assignedTasks.filter(t => t.status !== 'completed').length / (assignedTasks.length || 1)) * 100}%` }} />
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-32 relative overflow-hidden group"
                >
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">High Priority</span>
                    <div>
                        <span className="text-4xl font-bold text-zinc-900 dark:text-white">{assignedTasks.filter(t => t.priority === 'High' && t.status !== 'completed').length}</span>
                        <span className="text-zinc-500 text-xs ml-1">critical</span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-red-500 h-full" style={{ width: `${(assignedTasks.filter(t => t.priority === 'High' && t.status !== 'completed').length / (assignedTasks.length || 1)) * 100}%` }} />
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-32 relative overflow-hidden group"
                >
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Completed</span>
                    <div>
                        <span className="text-4xl font-bold text-zinc-900 dark:text-white">{assignedTasks.filter(t => t.status === 'completed').length}</span>
                        <span className="text-zinc-500 text-xs ml-1">done</span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${(assignedTasks.filter(t => t.status === 'completed').length / (assignedTasks.length || 1)) * 100}%` }} />
                    </div>
                </motion.div>

                <MoodleSyncButton variant="card" />
            </motion.div>

            {/* Main Task List */}
            <motion.div variants={itemVariants} className="bg-card border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden min-h-[500px] flex flex-col">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-100 dark:bg-zinc-900/20">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" /> My Personal Tasks
                    </h3>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openTaskModal({ assignedToId: currentUserMemberId, isPersonalWorkspace: true })}
                        className="text-xs flex items-center gap-1 font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Task
                    </motion.button>
                </div>

                <div ref={scrollRootRef as any} className="flex-1 overflow-y-auto p-0">
                        {tasksToRender.length > 0 ? (
                            <div className="divide-y divide-zinc-200 dark:divide-zinc-900">
                                {tasksToRender.map((task) => {
                                    const hasChildren = task.children && task.children.length > 0;
                                    const isExpanded = expandedIds.has(task.id);

                                    return (
                                        <div
                                            key={task.id}
                                            onClick={() => openEditTask(task)}
                                            className={cn(
                                                "group relative flex flex-col sm:flex-row sm:items-center justify-between p-5 transition-colors cursor-pointer border-l-4 border-transparent hover:border-l-emerald-500",
                                                task.source === 'moodle'
                                                    ? "bg-gradient-to-r from-orange-100/60 to-transparent dark:from-orange-900/40 dark:to-transparent border-orange-200/50 dark:border-orange-800/30 hover:from-orange-200/60 dark:hover:from-orange-800/50"
                                                    : "hover:bg-zinc-100 dark:hover:bg-zinc-900/40"
                                            )}
                                            style={{ paddingLeft: task.level > 0 ? `${1.25 + task.level * 1.5}rem` : '1.25rem' }}
                                        >
                                            <div className="flex items-start gap-3 mb-3 sm:mb-0">
                                                {/* Checkbox */}
                                                <button
                                                    onClick={(e) => handleStatusToggle(e, task)}
                                                    className={cn("mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50",
                                                        task.status === "completed"
                                                            ? "bg-emerald-500 border-emerald-500 hover:bg-emerald-600"
                                                            : "border-zinc-300 dark:border-zinc-700 bg-transparent group-hover:border-zinc-500 hover:border-emerald-500"
                                                    )}
                                                    title={task.status === "completed" ? "Mark as Incomplete" : "Mark as Completed"}
                                                >
                                                    {task.status === "completed" && (
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                                    )}
                                                </button>

                                                {/* Chevron between checkbox and title */}
                                                {hasChildren && (
                                                    <button
                                                        onClick={(e) => handleToggleExpand(task.id, e)}
                                                        className="flex-shrink-0 mt-1 p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
                                                        title={isExpanded ? "Collapse" : "Expand"}
                                                    >
                                                        <ChevronRight className={cn("w-3.5 h-3.5 text-zinc-500 transition-transform duration-200", isExpanded && "rotate-90")} />
                                                    </button>
                                                )}

                                                {/* Task content */}
                                                <div>
                                                    <h4 className={cn("font-medium text-base text-zinc-900 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white transition-colors",
                                                        task.status === "completed" && "line-through text-zinc-500"
                                                    )}>
                                                        {task.title}
                                                    </h4>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        {task.priority === 'High' && (
                                                            <span className="text-[10px] uppercase font-bold text-red-400 bg-red-950/20 px-1.5 py-0.5 rounded border border-red-900/30">High Priority</span>
                                                        )}
                                                        {task.deadline && (
                                                            <span className={cn("text-[11px] font-medium flex items-center gap-1",
                                                                new Date(task.deadline) < new Date() && task.status !== 'completed' ? "text-red-400" : "text-zinc-500"
                                                            )}>
                                                                {formatDaysLeft(task.deadline)}
                                                            </span>
                                                        )}
                                                        {task.requiredSkill && (
                                                            <span className="text-[11px] text-zinc-600 bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">{task.requiredSkill}</span>
                                                        )}
                                                        {task.recurrenceId && (
                                                            <span className="text-[10px] uppercase font-bold text-blue-500 bg-blue-950/10 px-1.5 py-0.5 rounded border border-blue-900/30 flex items-center gap-1">
                                                                <Repeat className="w-2.5 h-2.5" />
                                                                Recurring
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-center">
                                                {/* Add Subtask Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openTaskModal({
                                                            assignedToId: currentUserMemberId,
                                                            parentId: task.id,
                                                            teamId: task.teamId as string | undefined,
                                                            isPersonalWorkspace: true,
                                                        });
                                                    }}
                                                    className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors"
                                                    title="Add Subtask"
                                                >
                                                    <Plus className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                                                </button>

                                                <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                                    task.status === 'completed' ? "bg-emerald-950/10 text-emerald-500 border-emerald-900/30" :
                                                    (task.deadline && new Date(task.deadline) < new Date()) ? "bg-red-950/10 text-red-500 border-red-900/30" :
                                                        "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800"
                                                )}>
                                                    {task.status === 'completed' ? 'Completed' : (task.deadline && new Date(task.deadline) < new Date()) ? 'Overdue' : 'To Do'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {hasMoreTasks && (
                                    <div ref={sentinelRef} className="p-4 flex justify-center text-zinc-500">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-zinc-500"></div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div
                                className="flex flex-col items-center justify-center p-20 text-center"
                            >
                                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-700 mb-4">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-zinc-400 font-medium mb-1">No tasks found</h3>
                                <p className="text-zinc-600 text-sm mb-6">Your personal workspace is clear.</p>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => openTaskModal({ assignedToId: currentUserMemberId, isPersonalWorkspace: true })}
                                    className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-sm font-bold rounded-lg transition-colors"
                                >
                                    Create First Task
                                </motion.button>
                            </div>
                        )}
                </div>
            </motion.div >
        </motion.div >
    );
}
