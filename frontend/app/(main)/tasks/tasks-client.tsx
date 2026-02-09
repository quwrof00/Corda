"use client";
import { Plus, Calendar, AlertCircle, CheckCircle2, Play, Pause, Ban, Flag, RefreshCw, ChevronRight, ArrowUpDown, Filter, ChevronDown, ListFilter } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import CreateTaskModal from "@/components/CreateTaskModal";
import CreateTeamModal from "@/components/CreateTeamModal";
import TaskDetailDrawer from "@/components/TaskDetailDrawer";

import { useTasks, useUpdateTask, Task } from "@/hooks/useTasks";
import { useTeams } from "@/hooks/useTeams";
import { buildTaskTree } from "@/lib/taskTreeUtils";

function cn(...inputs: (string | undefined | null | false)[]) {
    return inputs.filter(Boolean).join(' ');
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
};

interface TaskItemProps {
    task: Task & { level: number };
    onSelect: (task: Task) => void;
    onStatusUpdate: (id: string, status: string, e?: React.MouseEvent) => void;
    getPriorityColor: (priority: string) => string;
    onToggleExpand: (taskId: string, e: React.MouseEvent) => void;
    isExpanded: boolean;
    onAddSubtask: (taskId: string, teamId: string, e: React.MouseEvent) => void;
}

const TaskItem = ({ task, onSelect, onStatusUpdate, getPriorityColor, onToggleExpand, isExpanded, onAddSubtask }: TaskItemProps) => {
    const hasChildren = task.children && task.children.length > 0;

    return (
        <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className={cn(
                "group relative border transition-colors duration-200 p-4 flex items-center gap-4 rounded-lg cursor-pointer hover:z-10",
                task.source === 'moodle'
                    ? "bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-950/30 dark:to-transparent border-orange-200/80 dark:border-orange-800/50 hover:from-orange-100/50 dark:hover:from-orange-900/50 hover:border-orange-300 dark:hover:border-orange-700"
                    : "bg-card border-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900",
                task.level > 0 && "border-l-4 border-l-zinc-800"
            )}
            onClick={() => onSelect(task)}
            style={{ marginLeft: task.level > 0 ? `${task.level * 1.5}rem` : 0 }}
        >
            {/* Status Indicator */}
            <div className={cn(
                "w-1 h-12 flex-shrink-0 transition-colors duration-300 rounded-full",
                task.status === 'completed' ? "bg-emerald-500" :
                    (task.status === 'active' || task.status === 'in-progress') ? "bg-blue-500" :
                        task.status === 'blocked' ? "bg-red-500" :
                            "bg-zinc-700 group-hover:bg-zinc-500"
            )} />

            {/* Checkbox/Status Action */}
            <button
                onClick={(e) => onStatusUpdate(task.id, task.status === 'completed' ? 'pending' : 'completed', e)}
                className={cn(
                    "flex-shrink-0 w-6 h-6 border flex items-center justify-center transition-all duration-200 rounded-full",
                    task.status === 'completed'
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-500"
                        : "border-zinc-700 text-transparent hover:border-zinc-500"
                )}
            >
                <CheckCircle2 className="w-4 h-4" />
            </button>

            {/* Chevron between checkbox and title */}
            {hasChildren && (
                <button
                    onClick={(e) => onToggleExpand(task.id, e)}
                    className="flex-shrink-0 p-0.5 hover:bg-zinc-800 rounded transition-colors"
                    title={isExpanded ? "Collapse" : "Expand"}
                >
                    <ChevronRight className={cn("w-3.5 h-3.5 text-zinc-500 transition-transform duration-200", isExpanded && "rotate-90")} />
                </button>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-6">
                    <h3 className={cn(
                        "font-medium text-sm transition-all truncate font-sans",
                        task.status === 'completed' ? "text-zinc-600 line-through" : "text-zinc-200"
                    )}>
                        {task.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-medium mt-1 uppercase tracking-wider">
                        <span>{task.team?.name || "Unassigned"}</span>
                        {task.requiredSkill && (
                            <>
                                <span className="text-zinc-800">|</span>
                                <span>{task.requiredSkill}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Priority */}
                <div className="md:col-span-3 flex items-center">
                    <span className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium border uppercase tracking-wide rounded",
                        getPriorityColor(task.priority)
                    )}>
                        <Flag className="w-3 h-3" />
                        {task.priority || "Normal"}
                    </span>
                </div>

                {/* Date */}
                <div className="md:col-span-3 flex items-center gap-2 text-xs text-zinc-500 font-mono justify-end">
                    {task.deadline && (
                        <>
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </>
                    )}
                </div>
            </div>

            {/* Hover Actions - always visible for better UX */}
            <div className="flex items-center gap-1 pl-4 border-l border-zinc-800 ml-4">
                {/* Logic for expand repeated here for redundancy/ease of access if needed, but chevron is primary */}
                <button
                    onClick={(e) => onAddSubtask(task.id, task.teamId || "", e)}
                    className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors rounded-md"
                    title="Add Subtask"
                >
                    <Plus className="w-4 h-4" />
                </button>
                {task.status !== 'active' && task.status !== 'in-progress' && task.status !== 'completed' && (
                    <button
                        onClick={(e) => onStatusUpdate(task.id, 'active', e)}
                        className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-950/30 transition-colors rounded-md"
                        title="Start Task"
                    >
                        <Play className="w-4 h-4" />
                    </button>
                )}

                {(task.status === 'active' || task.status === 'in-progress') && (
                    <button
                        onClick={(e) => onStatusUpdate(task.id, 'pending', e)}
                        className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-950/30 transition-colors rounded-md"
                        title="Pause Task"
                    >
                        <Pause className="w-4 h-4" />
                    </button>
                )}

                <button
                    onClick={(e) => onStatusUpdate(task.id, 'blocked', e)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors rounded-md"
                    title="Block Task"
                >
                    <Ban className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
};

const priorityScore: Record<string, number> = { "High": 3, "Medium": 2, "Low": 1 };

const FilterDropdown = ({
    icon: Icon,
    label,
    value,
    options,
    onChange,
    width = "w-32",
    align = "left"
}: {
    icon: React.ElementType,
    label?: string,
    value: string,
    options: { label: string, value: string }[],
    onChange: (val: string) => void,
    width?: string,
    align?: "left" | "right"
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedLabel = options.find(o => o.value === value)?.label || value;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center justify-between gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800/60 rounded-lg text-xs font-medium text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 hover:bg-zinc-800/40 transition-all",
                    width,
                    isOpen && "border-zinc-700 bg-zinc-800/60 text-zinc-200 ring-1 ring-zinc-800"
                )}
            >
                <div className="flex items-center gap-2 truncate">
                    <Icon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate">{label ? `${label}: ${selectedLabel}` : selectedLabel}</span>
                </div>
                <ChevronDown className={cn("w-3 h-3 text-zinc-600 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ duration: 0.1, ease: "easeOut" }}
                        className={cn(
                            "absolute top-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl shadow-black/40 z-50 overflow-hidden py-1 min-w-[140px]",
                            align === "right" ? "right-0" : "left-0",
                            width
                        )}
                    >
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full text-left px-3 py-1.5 text-xs font-medium transition-colors flex items-center justify-between group",
                                    value === opt.value ? "text-white bg-zinc-800" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                                )}
                            >
                                <span className="truncate">{opt.label}</span>
                                {value === opt.value && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                )}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function TasksClient({ initialTasks, userId }: { initialTasks: Task[], userId: string }) {
    const { data: session } = useSession();

    // Filters & Sort State
    const [sortBy, setSortBy] = useState<"deadline" | "priority" | "newest">("deadline");
    const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "overdue" | "custom">("all");
    const [priorityFilter, setPriorityFilter] = useState<"all" | "High" | "Medium" | "Low">("all");
    const [teamFilter, setTeamFilter] = useState<"all" | string>("all");
    const [statusFilter, setStatusFilter] = useState<"All" | "Todo" | "In Progress" | "Blocked" | "Done">("Todo");

    // Custom date range (simple implementation)
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");

    // Toggle for Tree View vs Flat View
    const [isTreeView, setIsTreeView] = useState(true); // Default to Tree View per requirement

    // Data Hooks
    const { data: tasksData, isLoading, refetch } = useTasks(undefined, { initialData: initialTasks });
    const { data: teamsData } = useTeams();

    const tasks = useMemo(() => (tasksData as Task[]) || [], [tasksData]);
    const teams = useMemo(() => teamsData || [], [teamsData]);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const updateTaskMutation = useUpdateTask();

    const handleStatusUpdate = async (taskId: string, newStatus: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            // 1. Update the target task
            await updateTaskMutation.mutateAsync({ id: taskId, status: newStatus });

            // 2. Propagate to children (User: "children should follow the parent task's state at all times")
            const getDescendants = (rootId: string, allTasks: Task[]): string[] => {
                const children = allTasks.filter(t => t.parentId === rootId);
                let descendantIds = children.map(c => c.id);
                for (const child of children) {
                    descendantIds = [...descendantIds, ...getDescendants(child.id, allTasks)];
                }
                return descendantIds;
            };

            const descendants = getDescendants(taskId, tasks);
            if (descendants.length > 0) {
                await Promise.all(descendants.map(id => updateTaskMutation.mutateAsync({ id, status: newStatus })));
            }

        } catch (err) {
            console.error("Failed to update task", err);
        }
    };

    const handleToggleExpand = (taskId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) next.delete(taskId);
            else next.add(taskId);
            return next;
        });
    };

    const [createParentId, setCreateParentId] = useState<string | undefined>(undefined);
    const [createTeamId, setCreateTeamId] = useState<string | undefined>(undefined);

    const handleCreateSubtask = (parentId: string, teamId: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCreateParentId(parentId);
        setCreateTeamId(teamId);
        setIsCreateModalOpen(true);
        setExpandedIds(prev => new Set(prev).add(parentId));
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isInput = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
            if (isInput || e.ctrlKey || e.metaKey) return;

            if (e.key.toLowerCase() === 'c') {
                e.preventDefault();
                setIsCreateModalOpen(true);
            } else if (e.key.toLowerCase() === 'n') {
                e.preventDefault();
                setIsCreateTeamModalOpen(true);
            }

            if (e.key === 'Escape' && selectedTask) {
                setSelectedTask(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedTask]);

    // Auto-switch sort to 'deadline' when 'Personal' team is selected
    useEffect(() => {
        const personalTeam = teams.find(t => t.name === 'Personal');
        if (personalTeam && teamFilter === personalTeam.id) {
            setSortBy('deadline');
        }
    }, [teamFilter, teams]);



    const flatTasks = useMemo(() => {
        let result = [...tasks];

        // 1. FILTERING
        // Status
        if (statusFilter !== "All") {
            result = result.filter(t => {
                const s = (t.status || "pending").toLowerCase();
                if (statusFilter === "Todo") return s === "pending" || s === "to-do";
                if (statusFilter === "In Progress") return s === "active" || s === "in-progress";
                if (statusFilter === "Blocked") return s === "blocked";
                if (statusFilter === "Done") return s === "completed";
                return false;
            });
        }

        // Team
        if (teamFilter !== "all") {
            result = result.filter(t => t.teamId === teamFilter);
        }

        // Priority
        if (priorityFilter !== "all") {
            result = result.filter(t => t.priority === priorityFilter);
        }

        // Date
        if (dateFilter !== "all") {
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endOfToday = new Date(startOfToday); endOfToday.setDate(endOfToday.getDate() + 1);
            const endOfWeek = new Date(startOfToday); endOfWeek.setDate(endOfWeek.getDate() + 7);

            result = result.filter(t => {
                if (!t.deadline) return false;
                const d = new Date(t.deadline);
                // Reset time for comparisons
                const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

                if (dateFilter === "today") return dDate.getTime() === startOfToday.getTime();
                if (dateFilter === "week") return dDate >= startOfToday && dDate < endOfWeek;
                if (dateFilter === "overdue") return dDate < startOfToday && t.status !== 'completed';
                if (dateFilter === "custom") {
                    if (!customStartDate || !customEndDate) return true;
                    // Simple string comparison or proper date object creation
                    const startRaw = new Date(customStartDate);
                    const endRaw = new Date(customEndDate);
                    return dDate >= startRaw && dDate <= endRaw;
                }
                return true;
            });
        }


        // 2. SORTING
        result.sort((a, b) => {
            if (sortBy === 'deadline') {
                // Ascending
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
            }
            if (sortBy === 'priority') {
                // Descending
                return (priorityScore[b.priority] || 0) - (priorityScore[a.priority] || 0);
            }
            if (sortBy === 'newest') {
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            }
            return 0;
        });


        // 3. TREE vs FLAT
        if (isTreeView) {
            // Build tree
            const tree = buildTaskTree(result);
            // Flatten functionality for rendering
            const hierarchy: (Task & { level: number })[] = [];

            // Re-implement flatten with recursive visibility if needed, 
            // but since we already filtered the *nodes* list, buildTaskTree might have orphans.
            // lib/taskTreeUtils handles this by making orphans roots.
            // We just need to traverse valid children.

            function traverse(nodes: Task[], level: number) {
                for (const node of nodes) {
                    hierarchy.push({ ...node, level });
                    if (node.children && node.children.length > 0 && expandedIds.has(node.id)) {
                        traverse(node.children, level + 1);
                    }
                }
            }
            traverse(tree, 0);
            return hierarchy;
        } else {
            // Flat list
            return result.map(t => ({ ...t, level: 0 }));
        }

    }, [tasks, statusFilter, teamFilter, priorityFilter, dateFilter, customStartDate, customEndDate, sortBy, isTreeView, expandedIds]);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High': return 'text-red-400 border-red-900/50 bg-red-950/20';
            case 'Medium': return 'text-amber-400 border-amber-900/50 bg-amber-950/20';
            case 'Low': return 'text-zinc-400 border-zinc-800 bg-zinc-900';
            default: return 'text-zinc-400 border-zinc-800 bg-zinc-900';
        }
    };

    if (!session) {
        return <div className="min-h-screen bg-background text-zinc-400 flex items-center justify-center font-sans text-sm">Loading...</div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-background text-zinc-200 selection:bg-zinc-800"
        >
            <div className="max-w-7xl mx-auto px-6 py-12">

                {/* Header & Controls */}
                <div className="mb-8 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white">Tasks</h1>
                            <p className="text-zinc-500 text-sm mt-1">Manage, filter, and track your team&apos;s workload.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <motion.button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-black rounded-lg font-bold text-sm hover:bg-white transition-colors">
                                <Plus className="w-4 h-4" /> New Task
                            </motion.button>
                        </div>
                    </div>

                    {/* FILTER BAR - Premium Design */}
                    {/* FILTER BAR - Premium Design */}
                    <div className="p-1 rounded-xl bg-zinc-900/30 border border-zinc-900/50 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">

                        {/* Status Tabs */}
                        <div className="flex items-center gap-1 p-1 bg-zinc-950/50 rounded-lg border border-zinc-900/50 overflow-x-auto scrollbar-hide max-w-full">
                            {(["All", "Todo", "In Progress", "Blocked", "Done"] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={cn(
                                        "relative px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md whitespace-nowrap transition-all z-0",
                                        statusFilter === s
                                            ? "text-white"
                                            : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
                                    )}
                                >
                                    {statusFilter === s && (
                                        <motion.div
                                            layoutId="activeRxFilter"
                                            className="absolute inset-0 bg-zinc-800 rounded-md shadow-sm border border-zinc-700/50 -z-10"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    {s}
                                </button>
                            ))}
                        </div>

                        {/* Dropdowns */}
                        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto p-1">

                            <FilterDropdown
                                icon={ArrowUpDown}
                                value={sortBy}
                                options={[
                                    { label: "Deadline", value: "deadline" },
                                    { label: "Priority", value: "priority" },
                                    { label: "Newest", value: "newest" }
                                ]}
                                onChange={(val) => setSortBy(val as "deadline" | "priority" | "newest")}
                                width="w-36"
                            />

                            <FilterDropdown
                                icon={Calendar}
                                value={dateFilter}
                                options={[
                                    { label: "Any Date", value: "all" },
                                    { label: "Today", value: "today" },
                                    { label: "This Week", value: "week" },
                                    { label: "Overdue", value: "overdue" },
                                    { label: "Custom...", value: "custom" }
                                ]}
                                onChange={(val) => setDateFilter(val as "all" | "today" | "week" | "overdue" | "custom")}
                                width="w-32"
                            />

                            <FilterDropdown
                                icon={Flag}
                                value={priorityFilter}
                                options={[
                                    { label: "Priority", value: "all" },
                                    { label: "High", value: "High" },
                                    { label: "Medium", value: "Medium" },
                                    { label: "Low", value: "Low" }
                                ]}
                                onChange={(val) => setPriorityFilter(val as "all" | "High" | "Medium" | "Low")}
                                width="w-28"
                            />

                            <FilterDropdown
                                icon={Filter}
                                value={teamFilter}
                                options={[
                                    { label: "All Teams", value: "all" },
                                    ...teams.map(t => ({ label: t.name, value: t.id }))
                                ]}
                                onChange={(val) => setTeamFilter(val)}
                                width="w-36"
                            />

                            {/* TREE TOGGLE */}
                            <div className="w-px h-6 bg-zinc-800 mx-2 hidden sm:block"></div>

                            <button
                                onClick={() => setIsTreeView(!isTreeView)}
                                className={cn(
                                    "p-2 rounded-lg border transition-colors ml-auto xl:ml-0",
                                    isTreeView ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                                )}
                                title={isTreeView ? "Tree View" : "List View"}
                            >
                                <ListFilter className="w-4 h-4" />
                            </button>

                        </div>
                    </div>

                    {/* Custom Date Inputs (Conditional) */}
                    <AnimatePresence>
                        {dateFilter === 'custom' && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="flex items-center gap-4 p-4 bg-zinc-900/20 rounded-lg border border-zinc-900/50 w-full max-w-lg mx-auto md:mx-0">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] uppercase font-bold text-zinc-500">From</label>
                                        <input
                                            type="date"
                                            value={customStartDate}
                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                            className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-zinc-600"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] uppercase font-bold text-zinc-500">To</label>
                                        <input
                                            type="date"
                                            value={customEndDate}
                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                            className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-zinc-600"
                                        />
                                    </div>
                                    <button
                                        className="mt-4 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                                        onClick={() => {
                                            // Optional: apply logic explicitly if manual trigger needed
                                            // Currently filters update automatically on state change
                                        }}
                                    >
                                        Apply Range
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Task List */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-1"
                >
                    {isLoading && tasks.length === 0 ? (
                        <div className="text-zinc-500 text-sm py-10 flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" /> Loading tasks...
                        </div>
                    ) : flatTasks.length > 0 ? (
                        <AnimatePresence mode="popLayout">
                            {flatTasks.map((task) => (
                                <TaskItem
                                    key={task.id}
                                    task={task}
                                    onSelect={setSelectedTask}
                                    onStatusUpdate={handleStatusUpdate}
                                    getPriorityColor={getPriorityColor}
                                    onToggleExpand={handleToggleExpand}
                                    isExpanded={expandedIds.has(task.id)}
                                    onAddSubtask={handleCreateSubtask}
                                />
                            ))}
                        </AnimatePresence>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-24 border border-zinc-900 border-dashed bg-card/50 rounded-xl hover:border-zinc-800 transition-colors group"
                        >
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-zinc-900 rounded-lg mb-4">
                                <AlertCircle className="w-6 h-6 text-zinc-600" />
                            </div>
                            <h3 className="text-lg font-medium text-zinc-300 tracking-tight">No Tasks Found</h3>
                            <p className="text-zinc-600 mb-6 text-xs max-w-sm mx-auto">
                                No active tasks found matching current filter parameters.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setCreateParentId(undefined);
                                    setIsCreateModalOpen(true);
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                            >
                                <Plus className="w-3 h-3" />
                                Create Task
                            </motion.button>
                        </motion.div>
                    )}
                </motion.div>
            </div>

            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setCreateParentId(undefined);
                    setCreateTeamId(undefined);
                }}
                onTaskCreated={refetch}
                currentUserId={userId}
                initialParentId={createParentId}
                initialTeamId={createTeamId}
            />

            <CreateTeamModal
                isOpen={isCreateTeamModalOpen}
                onClose={() => setIsCreateTeamModalOpen(false)}
            />

            {selectedTask && (
                <TaskDetailDrawer
                    selectedTask={selectedTask}
                    setSelectedTask={setSelectedTask}
                    updateTaskMutation={updateTaskMutation}
                    refreshTasks={refetch}
                    currentUserId={userId}
                    onCreateSubtask={(parentId) => handleCreateSubtask(parentId, selectedTask.teamId!)}
                />
            )}
        </motion.div>
    );
}