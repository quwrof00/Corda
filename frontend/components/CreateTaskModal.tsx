import { LoadingBars } from "@/components/shared/LoadingBars";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTeams } from "@/hooks/useTeams";
import { useCreateTask } from "@/hooks/useTasks";
import { ListTodo, X, Repeat, CalendarClock, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTaskCreated?: () => void;
    initialTeamId?: string;
    initialAssignedToId?: string;
    isPersonalWorkspace?: boolean;
    currentUserId?: string;
    initialParentId?: string;
    initialDeadline?: string;
}

export default function CreateTaskModal({
    isOpen,
    onClose,
    onTaskCreated,
    initialTeamId,
    initialAssignedToId,
    isPersonalWorkspace,
    currentUserId,
    initialParentId,
    initialDeadline
}: CreateTaskModalProps) {
    const { data: teams } = useTeams();
    const createTaskMutation = useCreateTask();

    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [deadline, setDeadline] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [requiredSkill, setRequiredSkill] = useState("");
    const [teamId, setTeamId] = useState(initialTeamId || "");
    const [assignedToId, setAssignedToId] = useState(initialAssignedToId || "");
    const [assignToMe, setAssignToMe] = useState(false);
    const [parentId, setParentId] = useState(initialParentId || "");

    // Recurring Task State
    const [isRecurring, setIsRecurring] = useState(false);
    const [frequency, setFrequency] = useState("daily");
    const [interval, setInterval] = useState(1);
    const [selectedDays, setSelectedDays] = useState<number[]>([]); // 0=Sunday
    const [dayOfMonth, setDayOfMonth] = useState<number | null>(null);
    const [recurrenceEndDate, setRecurrenceEndDate] = useState("");

    // Reset and initialize state when modal opens
    useEffect(() => {
        if (isOpen) {
            setTitle("");
            setDesc("");
            // Set deadline to initialDeadline if provided, else today's date
            if (initialDeadline) {
                setDeadline(initialDeadline);
            } else {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                setDeadline(`${year}-${month}-${day}`);
            }
            setPriority("Medium");
            setRequiredSkill("");

            setTeamId(initialTeamId || "");
            setAssignedToId(initialAssignedToId || "");
            setParentId(initialParentId || "");

            // Reset recurrence
            setIsRecurring(false);
            setFrequency("daily");
            setInterval(1);
            setSelectedDays([]);
            setDayOfMonth(null);
            setRecurrenceEndDate("");

            // Logic for "Assign to me":
            // Default to true if creating a new task (no initial assignee) or if explicitly assigned to self
            const shouldAssignToMe = isPersonalWorkspace || !initialAssignedToId || (!!currentUserId && initialAssignedToId === currentUserId);
            setAssignToMe(!!currentUserId && shouldAssignToMe);
        }
    }, [isOpen, initialTeamId, initialAssignedToId, isPersonalWorkspace, currentUserId, initialParentId, initialDeadline]);

    // Auto-select "Personal" team if no team is pre-selected
    useEffect(() => {
        if (isOpen && !teamId && !initialTeamId && teams) {
            const personalTeam = teams.find((t: { name: string }) => t.name === "Personal");
            if (personalTeam) {
                setTeamId(personalTeam.id);
            }
        }
    }, [isOpen, teamId, initialTeamId, teams]);

    // HCI: Auto-focus first input and Esc to close
    const titleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && titleInputRef.current) {
            // Small delay to ensure modal animation completes
            setTimeout(() => titleInputRef.current?.focus(), 100);
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Handle team selection changes to enforce Personal validation
    useEffect(() => {
        if (!teams || !teamId) return;

        const selectedTeam = teams.find((t: { id: string; name: string }) => t.id === teamId);
        const isPersonalTeam = selectedTeam?.name === "Personal";

        if (isPersonalTeam) {
            setAssignToMe(true);
            if (currentUserId) setAssignedToId(currentUserId);
        } else if (teamId !== initialTeamId && !assignToMe) {
            // Only reset ID if we've explicitly changed the team and aren't assigning to self
            setAssignedToId("");
        }

        // Reset parent if team changes, as parent must belong to same team
        if (teamId !== initialTeamId) {
            setParentId("");
        }

    }, [teamId, teams, initialTeamId, currentUserId]);

    if (!isOpen) return null;

    const selectedTeam = teams?.find((t: { id: string; name: string }) => t.id === teamId);
    const isPersonalTeam = selectedTeam?.name === "Personal";
    const isCheckboxDisabled = isPersonalWorkspace || isPersonalTeam || !currentUserId;

    const toggleDay = (day: number) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    const daysMap = [
        { label: "S", value: 0 },
        { label: "M", value: 1 },
        { label: "T", value: 2 },
        { label: "W", value: 3 },
        { label: "T", value: 4 },
        { label: "F", value: 5 },
        { label: "S", value: 6 },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        onClose(); // Close immediately for optimistic UI

        try {
            // Determine final assignedToId.
            // If checking box, force currentUserId if it exists.
            let finalAssignedToId = assignedToId;
            if (assignToMe && currentUserId) {
                finalAssignedToId = currentUserId;
            }

            // Construct Recurrence Object
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let recurrencePayload: any = undefined;
            if (isRecurring) {
                recurrencePayload = {
                    frequency,
                    interval: Number(interval),
                    daysOfWeek: frequency === 'weekly' ? selectedDays : [],
                    dayOfMonth: frequency === 'monthly' ? dayOfMonth : null,
                    endDate: recurrenceEndDate ? new Date(`${recurrenceEndDate}T23:59:59`).toISOString() : null,
                };

                // If weekly but no days selected, default to current day
                if (frequency === 'weekly' && selectedDays.length === 0) {
                    const todayDay = new Date(deadline || new Date()).getDay();
                    recurrencePayload.daysOfWeek = [todayDay];
                }
            }

            await createTaskMutation.mutateAsync({
                title,
                description: desc,
                deadline: deadline ? new Date(`${deadline}T23:59:59`).toISOString() : (() => { const d = new Date(); d.setHours(23, 59, 59); return d.toISOString(); })(), // Use ISO string for consistency. Fallback to today end of day.
                priority,
                requiredSkill,
                teamId,
                assignedToId: finalAssignedToId || undefined,
                parentId: parentId || undefined,
                recurrence: recurrencePayload,
            });

            if (onTaskCreated) {
                onTaskCreated();
            }
            toast.success(isRecurring ? "Recurring task created!" : "Task created successfully!");

            // Reset form
            setTitle("");
            setDesc("");
            // Reset to today's date
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            setDeadline(`${year}-${month}-${day}`);
            setPriority("Medium");
            setRequiredSkill("");
            setTeamId(initialTeamId || "");
            setAssignedToId(initialAssignedToId || "");
            setParentId(initialParentId || "");
            setAssignToMe(isPersonalWorkspace || false);

            setIsRecurring(false);
            setFrequency("daily");
            setInterval(1);
            setSelectedDays([]);
            setDayOfMonth(null);
            setRecurrenceEndDate("");

        } catch (err) {
            console.error(err);
            toast.error("Failed to create task.");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1, ease: "easeOut" }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-hidden"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ duration: 0.1, ease: "easeOut" }}
                        className="w-full max-w-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header - Fixed to top */}
                        <div className="flex-none flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center shadow-sm">
                                    <ListTodo className="w-5 h-5 text-white dark:text-black" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">New Task</h1>
                                    <p className="text-zinc-500 text-xs font-medium">
                                        {isPersonalWorkspace ? "Add to your personal list" : "Create a task for your team"}
                                    </p>
                                </div>
                            </div>
                            <motion.button
                                onClick={onClose}
                                className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
                                title="Close (Esc)"
                                type="button"
                            >
                                <X className="w-5 h-5" />
                            </motion.button>
                        </div>

                        {/* Form - Flexible container */}
                        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">

                            {/* Scrollable Content Area */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                {/* 2-Column Compact Layout */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left Column */}
                                    <div className="space-y-5">
                                        {/* Title */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                                Task Title <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                ref={titleInputRef}
                                                type="text"
                                                placeholder={isPersonalWorkspace ? "Buy groceries" : "Implement Auth Flow"}
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                className="w-full px-3 py-2.5 bg-[var(--header-time)] border border-[var(--border-time)] rounded-lg focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:border-zinc-900 dark:focus:border-white outline-none transition-all text-zinc-900 dark:text-zinc-200 text-sm placeholder:text-zinc-400"
                                                required
                                                autoComplete="off"
                                            />
                                        </div>

                                        {/* Description */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                                Description
                                            </label>
                                            <textarea
                                                placeholder="Details about the task..."
                                                value={desc}
                                                onChange={(e) => setDesc(e.target.value)}
                                                rows={4}
                                                className="w-full px-3 py-2.5 bg-[var(--header-time)] border border-[var(--border-time)] rounded-lg focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:border-zinc-900 dark:focus:border-white outline-none transition-all text-zinc-900 dark:text-zinc-200 text-sm placeholder:text-zinc-400 resize-none"
                                            />
                                        </div>

                                        {/* Team Selection */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                                Team <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={teamId}
                                                    onChange={(e) => setTeamId(e.target.value)}
                                                    className="w-full px-3 py-2.5 bg-[var(--header-time)] border border-[var(--border-time)] rounded-lg focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:border-zinc-900 dark:focus:border-white outline-none transition-all text-zinc-900 dark:text-zinc-200 text-sm appearance-none"
                                                    required
                                                >
                                                    {!teamId && <option value="" disabled>Select a team</option>}
                                                    {teams?.map((team: { id: string, name: string }) => (
                                                        <option key={team.id} value={team.id}>
                                                            {team.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                                    <ChevronDown className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Assign to Me Checkbox */}
                                        <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors -ml-2">
                                            <input
                                                type="checkbox"
                                                id="assignToMe"
                                                checked={assignToMe}
                                                disabled={isCheckboxDisabled}
                                                onChange={(e) => {
                                                    setAssignToMe(e.target.checked);
                                                    if (e.target.checked && currentUserId) {
                                                        setAssignedToId(currentUserId);
                                                    } else {
                                                        setAssignedToId("");
                                                    }
                                                }}
                                                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 focus:ring-zinc-900 dark:focus:ring-white disabled:opacity-50 transition-all cursor-pointer"
                                            />
                                            <label htmlFor="assignToMe" className={`text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer select-none ${isCheckboxDisabled && "cursor-not-allowed opacity-50"}`}>
                                                Assign to me
                                            </label>
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-5">
                                        {/* Priority */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                                Priority <span className="text-red-500">*</span>
                                            </label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {["Low", "Medium", "High"].map((p) => (
                                                    <button
                                                        key={p}
                                                        type="button"
                                                        onClick={() => setPriority(p)}
                                                        className={cn(
                                                            "px-2 py-2.5 text-sm font-medium rounded-lg border transition-all",
                                                            priority === p
                                                                ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white shadow-sm"
                                                                : "bg-[var(--header-time)]/50 text-zinc-600 dark:text-zinc-400 border-[var(--border-time)] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                        )}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Deadline */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                                Deadline <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={deadline}
                                                onChange={(e) => setDeadline(e.target.value)}
                                                className="w-full px-3 py-2.5 bg-[var(--header-time)] border border-[var(--border-time)] rounded-lg focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:border-zinc-900 dark:focus:border-white outline-none transition-all text-zinc-900 dark:text-zinc-200 text-sm [color-scheme:light] dark:[color-scheme:dark]"
                                                required
                                            />
                                        </div>

                                        {/* Required Skill */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                                Required Skill
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. React"
                                                value={requiredSkill}
                                                onChange={(e) => setRequiredSkill(e.target.value)}
                                                className="w-full px-3 py-2.5 bg-[var(--header-time)] border border-[var(--border-time)] rounded-lg focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:border-zinc-900 dark:focus:border-white outline-none transition-all text-zinc-900 dark:text-zinc-200 text-sm placeholder:text-zinc-400"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Recurrence Section (Full Width) */}
                                <div className="mt-8 pt-6 border-t border-dashed border-[var(--border-time)]">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("p-1.5 rounded-md", isRecurring ? "bg-[var(--accent-time)]/20 text-[var(--accent-time)] border border-[var(--accent-time)]/30" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500")}>
                                                <Repeat className="w-4 h-4" />
                                            </div>
                                            <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                                Recurring Task
                                            </label>
                                        </div>


                                        <button
                                            type="button"
                                            onClick={() => setIsRecurring(!isRecurring)}
                                            className={cn(
                                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:ring-offset-2",
                                                isRecurring ? "bg-[var(--accent-time)]" : "bg-zinc-200 dark:bg-zinc-800"
                                            )}
                                        >
                                            <span className="sr-only">Enable recurrence</span>
                                            <span
                                                className={cn(
                                                    "inline-block h-4 w-4 transform rounded-full bg-[var(--accent-time-text)] transition-transform",
                                                    isRecurring ? "translate-x-6" : "translate-x-1"
                                                )}
                                            />
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {isRecurring && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="bg-zinc-50 dark:bg-black/20 rounded-xl p-5 border border-zinc-100 dark:border-zinc-800/50 space-y-5">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {/* Frequency */}
                                                        <div>
                                                            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                                                                Repeats
                                                            </label>
                                                            <select
                                                                value={frequency}
                                                                onChange={(e) => setFrequency(e.target.value)}
                                                                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-[var(--border-time)] rounded-lg text-sm focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 outline-none"
                                                            >
                                                                <option value="daily">Daily</option>
                                                                <option value="weekly">Weekly</option>
                                                                <option value="monthly">Monthly</option>
                                                            </select>
                                                        </div>

                                                        {/* Interval */}
                                                        <div>
                                                            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                                                                Repeat every
                                                            </label>
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    value={interval}
                                                                    onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
                                                                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-[var(--border-time)] rounded-lg text-sm focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 outline-none"
                                                                />
                                                                <span className="text-xs text-zinc-500 font-medium truncate">
                                                                    {frequency === 'daily' ? 'day(s)' : frequency === 'weekly' ? 'week(s)' : 'month(s)'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Day of Month (Monthly only) */}
                                                        {frequency === 'monthly' && (
                                                            <div>
                                                                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-100 mb-1.5">
                                                                    On designated day
                                                                </label>
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="number"
                                                                        min={1}
                                                                        max={31}
                                                                        placeholder="1-31"
                                                                        value={dayOfMonth || ""}
                                                                        onChange={(e) => setDayOfMonth(parseInt(e.target.value) || null)}
                                                                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-[var(--border-time)] rounded-lg text-sm focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 outline-none"
                                                                    />
                                                                    <span className="text-xs text-zinc-500 font-medium truncate">
                                                                        of month
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Days of Week (Weekly only) */}
                                                    {frequency === 'weekly' && (
                                                        <div className="space-y-2">
                                                            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                                                                Repeat On
                                                            </label>
                                                            <div className="flex flex-wrap gap-2">
                                                                {daysMap.map((day) => {
                                                                    const isSelected = selectedDays.includes(day.value);
                                                                    return (
                                                                        <button
                                                                            key={day.value}
                                                                            type="button"
                                                                            onClick={() => toggleDay(day.value)}
                                                                            className={cn(
                                                                                "w-8 h-8 rounded-full text-xs font-bold transition-all flex items-center justify-center border",
                                                                                isSelected
                                                                                    ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white scale-105"
                                                                                    : "bg-white dark:bg-zinc-900 text-zinc-400 border-[var(--border-time)] hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-600"
                                                                            )}
                                                                        >
                                                                            {day.label}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                            <p className="text-[10px] text-zinc-400">
                                                                {selectedDays.length === 0 ? "Defaults to the same day as the deadline" : `${selectedDays.length} day(s) selected`}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* End Date */}
                                                    <div>
                                                        <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                                                            Ends On (Optional)
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="date"
                                                                value={recurrenceEndDate}
                                                                onChange={(e) => setRecurrenceEndDate(e.target.value)}
                                                                className="w-full pl-10 pr-3 py-2 bg-white dark:bg-zinc-900 border border-[var(--border-time)] rounded-lg text-sm focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 outline-none [color-scheme:light] dark:[color-scheme:dark]"
                                                            />
                                                            <CalendarClock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400 pointer-events-none" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Footer Actions - Fixed to bottom */}
                            <div className="flex-none flex items-center justify-between p-5 border-t border-zinc-200 dark:border-zinc-900 bg-[var(--header-time)]">
                                <span className="text-xs text-zinc-400 font-medium">
                                    * Required fields
                                </span>
                                <div className="flex items-center gap-3">
                                    <motion.button
                                        type="button"
                                        onClick={onClose}
                                        className="px-5 py-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 font-medium transition-all text-sm"
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        type="submit"
                                        disabled={createTaskMutation.isPending}
                                        className="px-6 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black font-semibold shadow-lg shadow-zinc-500/10 transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                                    >
                                        {createTaskMutation.isPending ? (
                                            <>
                                                <LoadingBars className="w-4 h-4" />
                                                <span>{isRecurring ? "Scheduling..." : "Creating..."}</span>
                                            </>
                                        ) : (
                                            <span>{isRecurring ? "Schedule Task" : "Create Task"}</span>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
