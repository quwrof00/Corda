import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Task } from "./types";
import { cn, formatDaysLeft } from "./utils";
import { CheckCircle2, Plus, ChevronRight, Repeat, Loader2 } from "lucide-react";
import { buildTaskTree, flattenTree } from "@/lib/taskTreeUtils";
import { useUpdateTask } from "@/hooks/useTasks";

interface PersonalWorkspaceProps {
    assignedTasks: Task[];
    currentUserMemberId?: string;
    setSelectedMemberId: (id: string) => void;
    setCreateTaskModalOpen: (open: boolean) => void;
    setParentTaskId?: (id: string | undefined) => void;
    setParentTeamId?: (id: string | undefined) => void;
    openEditTask: (task: Task) => void;
}



export function PersonalWorkspace({
    assignedTasks,
    currentUserMemberId,
    setSelectedMemberId,
    setCreateTaskModalOpen,
    setParentTaskId,
    setParentTeamId,
    openEditTask
}: PersonalWorkspaceProps) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const updateTaskMutation = useUpdateTask();

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
        if (updateTaskMutation.isPending) return;
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';

        try {
            await updateTaskMutation.mutateAsync({ id: task.id, status: newStatus });
        } catch (err) {
            console.error("Failed to update task", err);
        }
    };

    // Build tree and flatten for rendering
    const tasksToRender = useMemo(() => {
        const sortedTasks = [...assignedTasks].sort((a, b) => {
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
        const tree = buildTaskTree(sortedTasks);
        return flattenTree(tree, expandedIds);
    }, [assignedTasks, expandedIds]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if user is typing in an input or textarea
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                return;
            }

            if (e.key.toLowerCase() === 'c') {
                e.preventDefault();
                setSelectedMemberId(currentUserMemberId || "");
                setCreateTaskModalOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentUserMemberId, setSelectedMemberId, setCreateTaskModalOpen]);

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

                <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-32 relative overflow-hidden group"
                >
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Workspace</span>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="text-xs bg-zinc-200 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-600 dark:text-zinc-300">Private</div>
                        <div className="text-xs bg-zinc-200 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-600 dark:text-zinc-300">Secure</div>
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-2">Only you can see these tasks</p>
                </motion.div>
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
                        onClick={() => {
                            setSelectedMemberId(currentUserMemberId || "");
                            setCreateTaskModalOpen(true);
                        }}
                        className="text-xs flex items-center gap-1 font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Task
                    </motion.button>
                </div>

                <div className="flex-1 overflow-y-auto p-0">
                    <AnimatePresence mode="popLayout">
                        {tasksToRender.length > 0 ? (
                            <div className="divide-y divide-zinc-200 dark:divide-zinc-900">
                                {tasksToRender.map((task) => {
                                    const hasChildren = task.children && task.children.length > 0;
                                    const isExpanded = expandedIds.has(task.id);

                                    return (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            whileHover={{ x: 4 }}
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
                                                    disabled={updateTaskMutation.isPending}
                                                    className={cn("mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50",
                                                        task.status === "completed"
                                                            ? "bg-emerald-500 border-emerald-500 hover:bg-emerald-600"
                                                            : "border-zinc-300 dark:border-zinc-700 bg-transparent group-hover:border-zinc-500 hover:border-emerald-500"
                                                    )}
                                                    title={task.status === "completed" ? "Mark as Incomplete" : "Mark as Completed"}
                                                >
                                                    {task.status === "completed" && (
                                                        updateTaskMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin text-white" /> : <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                                    )}
                                                    {task.status !== "completed" && updateTaskMutation.isPending && <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />}
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
                                                        setSelectedMemberId(currentUserMemberId || '');
                                                        if (setParentTaskId) setParentTaskId(task.id);
                                                        if (setParentTeamId && task.teamId) setParentTeamId(task.teamId as string);
                                                        setCreateTaskModalOpen(true);
                                                    }}
                                                    className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors"
                                                    title="Add Subtask"
                                                >
                                                    <Plus className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                                                </button>

                                                <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                                    task.status === 'completed' ? "bg-emerald-950/10 text-emerald-500 border-emerald-900/30" :
                                                        task.status === 'in-progress' ? "bg-blue-950/10 text-blue-500 border-blue-900/30" :
                                                            "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800"
                                                )}>
                                                    {task.status.replace('-', ' ')}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
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
                                    onClick={() => {
                                        setSelectedMemberId(currentUserMemberId || "");
                                        setCreateTaskModalOpen(true);
                                    }}
                                    className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-sm font-bold rounded-lg transition-colors"
                                >
                                    Create First Task
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div >
        </motion.div >
    );
}
