"use client";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    X,
    Calendar as CalendarIcon,
    MoreHorizontal,
    CheckCircle2
} from "lucide-react";
import { Task } from "@/hooks/useTasks";
import cn from "clsx";

interface CalendarOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    onSelectTask: (task: Task) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarOverlay({ isOpen, onClose, tasks, onSelectTask }: CalendarOverlayProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
            case 'High': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'Medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'Low': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
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
                    className="fixed inset-0 z-[45] bg-[#09090b]/95 backdrop-blur-xl flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-zinc-900 rounded-lg">
                                <CalendarIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white leading-none">{monthName} {year}</h2>
                                <p className="text-zinc-400 text-xs mt-1 uppercase tracking-widest font-bold">
                                    {tasks.filter(t => {
                                        if (!t.deadline) return false;
                                        const d = new Date(t.deadline);
                                        return d.getMonth() === month && d.getFullYear() === year;
                                    }).length} tasks this month
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-white/5">
                                <button
                                    onClick={handlePrevMonth}
                                    className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setCurrentDate(new Date())}
                                    className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
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
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-calendar-scroll">
                        <div className="max-w-7xl mx-auto">
                            {/* Days of week */}
                            <div className="grid grid-cols-7 mb-4">
                                {DAYS.map(day => (
                                    <div key={day} className="text-center py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-px bg-white/10 border border-white/10 rounded-2xl overflow-hidden shadow-2xl mb-8">
                                {calendarDays.map((d, i) => {
                                    const dateKey = `${d.year}-${d.month}-${d.day}`;
                                    const dayTasks = tasksByDate[dateKey] || [];
                                    const todaysDate = isToday(d.day, d.month, d.year);

                                    return (
                                        <div
                                            key={i}
                                            className={cn(
                                                "bg-[#09090b] p-2 flex flex-col gap-2 min-h-[140px] relative transition-colors",
                                                !d.isCurrentMonth && "opacity-20 bg-[#050505]",
                                                d.isCurrentMonth && "hover:bg-zinc-900/40"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={cn(
                                                    "text-xs font-bold tabular-nums",
                                                    todaysDate ? "w-7 h-7 flex items-center justify-center bg-white text-black rounded-full shadow-[0_0_20px_rgba(255,255,255,0.15)]" : "text-zinc-600"
                                                )}>
                                                    {d.day}
                                                </span>
                                                {dayTasks.length > 0 && d.isCurrentMonth && (
                                                    <div className="flex -space-x-1">
                                                        {dayTasks.slice(0, 3).map((t, idx) => (
                                                            <div
                                                                key={idx}
                                                                className={cn(
                                                                    "w-1.5 h-1.5 rounded-full border border-[#09090b]",
                                                                    t.priority === 'High' ? "bg-red-500" :
                                                                        t.priority === 'Medium' ? "bg-amber-500" :
                                                                            "bg-emerald-500"
                                                                )}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
                                                {dayTasks.slice(0, 2).map(task => {
                                                    const isCompleted = task.status === 'completed';
                                                    return (
                                                        <button
                                                            key={task.id}
                                                            onClick={() => onSelectTask(task)}
                                                            className={cn(
                                                                "w-full text-left px-2 py-1.5 rounded-lg border text-[10px] font-bold truncate transition-all hover:brightness-125 flex items-center justify-between gap-1",
                                                                isCompleted
                                                                    ? "bg-zinc-900/50 text-zinc-600 border-zinc-800/50 line-through font-medium"
                                                                    : getPriorityColor(task.priority)
                                                            )}
                                                        >
                                                            <span className="truncate">{task.title}</span>
                                                            {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-500/50 shrink-0" />}
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
                                    className="w-full max-w-md bg-[#09090b] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                                >
                                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">
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
                                                onClick={() => {
                                                    onSelectTask(task);
                                                    setSelectedDate(null);
                                                }}
                                                className="group flex items-center gap-4 p-4 bg-zinc-900/50 border border-white/5 rounded-2xl hover:bg-zinc-800 cursor-pointer transition-all hover:scale-[1.01]"
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
                                                        task.status === 'completed' ? "text-zinc-600 line-through" : "text-zinc-200"
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
