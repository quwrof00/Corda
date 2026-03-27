"use client";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    X,
    Calendar as CalendarIcon,
    MoreHorizontal,
    CheckCircle2,
    Plus
} from "lucide-react";
import { Task, useUpdateTask } from "@/hooks/useTasks";
import cn from "clsx";
import { toast } from "sonner";

interface CalendarOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    onSelectTask: (task: Task) => void;
    onAddTask?: (date: string) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarOverlay({ isOpen, onClose, tasks, onSelectTask, onAddTask }: CalendarOverlayProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const updateTaskMutation = useUpdateTask();

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData("taskId", taskId);
        e.dataTransfer.effectAllowed = "move";
        const target = e.target as HTMLElement;
        target.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const target = e.target as HTMLElement;
        target.style.opacity = '1';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e: React.DragEvent, year: number, month: number, day: number) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("taskId");
        if (!taskId) return;

        // Set deadline to noon of that day to avoid TZ issues
        const newDeadline = new Date(year, month, day, 12, 0, 0).toISOString();

        try {
            await updateTaskMutation.mutateAsync({
                id: taskId,
                deadline: newDeadline,
            });
            toast.success("Deadline updated");
        } catch {
            toast.error("Failed to update deadline");
        }
    };

    // Prevent body scroll when overlay is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthName = useMemo(() => {
        return new Intl.DateTimeFormat("en-US", { month: "long" }).format(currentDate);
    }, [currentDate]);

    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];

        // Fill previous month gaps
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            days.push({
                day: prevMonthLastDay - i,
                month: month - 1,
                year,
                isCurrentMonth: false
            });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                day: i,
                month,
                year,
                isCurrentMonth: true
            });
        }

        // Fill next month gaps to make it 6 rows (42 cells)
        const remainingCells = 42 - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            days.push({
                day: i,
                month: month + 1,
                year,
                isCurrentMonth: false
            });
        }

        return days;
    }, [year, month]);

    const tasksByDate = useMemo(() => {
        const map: Record<string, Task[]> = {};
        tasks.forEach(task => {
            if (task.deadline) {
                const date = new Date(task.deadline);
                const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                if (!map[key]) map[key] = [];
                map[key].push(task);
            }
        });
        return map;
    }, [tasks]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1));
    };

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'High': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 backdrop-blur-sm';
            case 'Medium': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 backdrop-blur-sm';
            case 'Low': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 backdrop-blur-sm';
            default: return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20 backdrop-blur-sm';
        }
    };

    const isToday = (day: number, m: number, y: number) => {
        const today = new Date();
        return today.getDate() === day && today.getMonth() === m && today.getFullYear() === y;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[45] bg-background/80 backdrop-blur-3xl flex flex-col overflow-hidden"
                >
                    {/* Ambient Glows */}
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--accent-time)] opacity-[0.08] rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--accent-time)] opacity-[0.08] rounded-full blur-[120px] pointer-events-none" />
                    {/* Header */}
                    <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-[var(--border-time)] bg-gradient-to-r from-[var(--header-time)] to-background shadow-sm">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="p-2 bg-[var(--accent-time)] rounded-lg shadow-sm">
                                <CalendarIcon className="w-5 h-5 text-[var(--accent-time-text)]" />
                            </div>
                            <div>
                                <h2 className="text-xl md:text-2xl font-black text-foreground leading-none tracking-tight">{monthName} <span className="text-[var(--accent-time)] opacity-70 font-mono">{year}</span></h2>
                                <p className="text-zinc-400 text-[10px] md:text-xs mt-1 uppercase tracking-widest font-bold">
                                    {tasks.filter(t => {
                                        if (!t.deadline) return false;
                                        const d = new Date(t.deadline);
                                        return d.getMonth() === month && d.getFullYear() === year;
                                    }).length} tasks this month
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between w-full md:w-auto gap-4">
                            <div className="flex items-center gap-1 bg-[var(--header-time)] p-1 rounded-lg border border-[var(--border-time)]">
                                <button
                                    onClick={handlePrevMonth}
                                    className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setCurrentDate(new Date())}
                                    className="px-3 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                                >
                                    Today
                                </button>
                                <button
                                    onClick={handleNextMonth}
                                    className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Calendar Body */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 custom-calendar-scroll">
                        <div className="max-w-7xl mx-auto">
                            {/* Days of week - Hidden on Mobile */}
                            <div className="hidden md:grid grid-cols-7 mb-4">
                                {DAYS.map(day => (
                                    <div key={day} className="text-center py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid - Mobile-first 1 Column, Desktop 7 Columns */}
                            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mb-8">
                                {calendarDays.map((d, i) => {
                                    const dateKey = `${d.year}-${d.month}-${d.day}`;
                                    const dayTasks = tasksByDate[dateKey] || [];
                                    const todaysDate = isToday(d.day, d.month, d.year);

                                    return (
                                        <div
                                            key={i}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, d.year, d.month, d.day)}
                                            className={cn(
                                                "group p-4 flex flex-col gap-3 transition-all rounded-2xl border-2",
                                                todaysDate 
                                                    ? "bg-[var(--accent-time)]/[0.03] border-[var(--accent-time)] shadow-[0_15px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.3)] z-10" 
                                                    : "bg-card/50 backdrop-blur-md border-[var(--border-time)] hover:border-[var(--accent-time)]/30 hover:shadow-xl hover:-translate-y-1",
                                                !d.isCurrentMonth ? "hidden md:flex opacity-20 grayscale-[0.8] scale-[0.98] pointer-events-none" : "flex",
                                                "min-h-[100px] md:min-h-[160px]"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={cn(
                                                    "text-sm font-black tabular-nums transition-all flex items-center gap-2",
                                                    todaysDate ? "text-[var(--accent-time)]" : "text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-200"
                                                )}>
                                                    <span className="md:hidden text-[10px] font-bold uppercase tracking-widest opacity-60">
                                                        {DAYS[new Date(d.year, d.month, d.day).getDay()]}
                                                    </span>
                                                    {d.day}
                                                </span>
                                                <div className="flex gap-2 items-center">
                                                    {dayTasks.length > 0 && d.isCurrentMonth && (
                                                        <div className="flex -space-x-1">
                                                            {dayTasks.slice(0, 3).map((t, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className={cn(
                                                                        "w-1.5 h-1.5 rounded-full border border-background",
                                                                        t.priority === 'High' ? "bg-red-500" :
                                                                            t.priority === 'Medium' ? "bg-amber-500" :
                                                                                "bg-emerald-500"
                                                                    )}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                    {d.isCurrentMonth && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (onAddTask) {
                                                                    const dateStr = `${d.year}-${String(d.month + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
                                                                    onAddTask(dateStr);
                                                                }
                                                            }}
                                                            className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition-all duration-200"
                                                        >
                                                            <Plus className="w-4 h-4 md:w-3.5 md:h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
                                                {dayTasks.slice(0, 2).map(task => {
                                                    const isCompleted = task.status === 'completed';
                                                    return (
                                                        <button
                                                            key={task.id}
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e, task.id)}
                                                            onDragEnd={handleDragEnd}
                                                            onClick={() => onSelectTask(task)}
                                                            className={cn(
                                                                "w-full text-left px-2.5 py-2 rounded-lg border text-[10px] font-bold truncate transition-all hover:scale-[1.02] flex items-center justify-between gap-2 shadow-sm",
                                                                isCompleted
                                                                    ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-800 line-through opacity-60"
                                                                    : getPriorityColor(task.priority)
                                                            )}
                                                        >
                                                            <span className="truncate">{task.title}</span>
                                                            {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {dayTasks.length > 2 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedDate(new Date(d.year, d.month, d.day));
                                                    }}
                                                    className="w-full py-1.5 mt-auto text-[9px] font-black text-blue-500 hover:text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 rounded-lg flex items-center justify-center gap-1 transition-all uppercase border border-blue-500/10"
                                                >
                                                    <MoreHorizontal className="w-3 h-3" />
                                                    {dayTasks.length - 2} More
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* View More Overlay (Inside the main overlay for performance) */}
                    <AnimatePresence>
                        {selectedDate && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedDate(null)}
                                className="fixed inset-0 z-[48] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    onClick={e => e.stopPropagation()}
                                    className="w-full max-w-md bg-background border border-[var(--border-time)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                                >
                                    <div className="p-6 border-b border-[var(--border-time)] bg-[var(--header-time)] flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-foreground">
                                                {new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" }).format(selectedDate)}
                                            </h3>
                                            <p className="text-zinc-500 text-xs mt-0.5 uppercase tracking-wider font-bold">Daily Schedule</p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedDate(null)}
                                            className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="p-6 overflow-y-auto space-y-3">
                                        {(tasksByDate[`${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`] || []).map(task => (
                                            <div
                                                key={task.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, task.id)}
                                                onDragEnd={handleDragEnd}
                                                onClick={() => {
                                                    onSelectTask(task);
                                                    setSelectedDate(null);
                                                }}
                                                className="group flex items-center gap-4 p-4 bg-[var(--header-time)] border border-[var(--border-time)] rounded-2xl hover:brightness-105 cursor-pointer transition-all hover:scale-[1.01]"
                                            >
                                                <div className={cn(
                                                    "w-1 h-8 rounded-full",
                                                    task.status === 'completed' ? "bg-emerald-500" :
                                                        (task.status === 'active' || task.status === 'in-progress') ? "bg-blue-500" :
                                                            "bg-zinc-700"
                                                )} />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={cn(
                                                        "text-sm font-bold truncate",
                                                        task.status === 'completed' ? "text-zinc-600 line-through" : "text-foreground"
                                                    )}>
                                                        {task.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={cn(
                                                            "text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded border",
                                                            getPriorityColor(task.priority)
                                                        )}>
                                                            {task.priority || "Normal"}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                                                            {task.team?.name || "Unassigned"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
