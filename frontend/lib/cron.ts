import cron, { ScheduledTask } from 'node-cron';
import { prisma } from './prisma';

// Type for the global object to hold our cron job
const globalForCron = global as unknown as { cronJob: ScheduledTask };

// Use a lock mechanism to prevent overlapping executions if checking frequently
let isJobRunning = false;

export function initCron() {
    // Prevent multiple instances in development
    if (globalForCron.cronJob) {
        console.log('Cron job already initialized. Skipping re-initialization.');
        return;
    }

    console.log('Initializing recurring task cron job...');

    // Schedule:
    // - Development: Run every minute ('* * * * *') to make testing easier.
    // - Production: standard cron ('0 * * * *') hourly is usually sufficient.
    const schedule = process.env.NODE_ENV === 'development' ? '* * * * *' : '0 * * * *';

    const job = cron.schedule(schedule, async () => {
        if (isJobRunning) {
            console.log('Recurring task job already running, skipping...');
            return;
        }

        isJobRunning = true;
        try {
            // console.log('Checking for recurring tasks...');
            await processRecurringTasks();
        } catch (error) {
            console.error('Error processing recurring tasks:', error);
        } finally {
            isJobRunning = false;
        }
    });

    // Save instance to global to prevent duplicates in dev
    if (process.env.NODE_ENV !== 'production') {
        globalForCron.cronJob = job;
    }
}

export async function processRecurringTasks() {
    const now = new Date();

    // Find all recurrences that are due
    const dueRecurrences = await prisma.recurrence.findMany({
        where: {
            nextRunAt: {
                lte: now,
            },
            OR: [
                { endDate: null },
                { endDate: { gt: now } }, // Only if endDate is in the future
            ],
        },
        include: {
            tasks: {
                orderBy: {
                    createdAt: 'desc',
                },
                take: 1,
            },
        },
    });

    if (dueRecurrences.length > 0) {
        console.log(`Found ${dueRecurrences.length} due recurrences.`);
    }

    for (const recurrence of dueRecurrences) {
        // 1. Get the template task (last created task for this recurrence)
        const templateTask = recurrence.tasks[0];

        if (!templateTask) {
            console.warn(`Recurrence ${recurrence.id} has no template task. Skipping.`);
            continue;
        }

        // 2. Create the new task
        // Calculate deadline offset
        const originalDuration = templateTask.deadline.getTime() - templateTask.createdAt.getTime();
        const newDeadline = new Date(now.getTime() + originalDuration);

        try {
            const newTask = await prisma.task.create({
                data: {
                    title: templateTask.title,
                    desc: templateTask.desc,
                    priority: templateTask.priority,
                    status: 'pending', // Reset status
                    requiredSkill: templateTask.requiredSkill,
                    recurrenceId: recurrence.id,
                    teamId: templateTask.teamId,
                    assignedToId: templateTask.assignedToId,
                    parentId: templateTask.parentId, // Optional: verify if we want to copy this
                    deadline: newDeadline,
                    source: 'manual', // or 'recurrence' if we add that enum
                },
            });



            console.log(`Generated recurring task for recurrence ${recurrence.id}`);

            // 3. Calculate next run date
            let nextDate = new Date(recurrence.nextRunAt);

            // Loop to ensure the next date is in the future
            // This handles cases where the server was down and we missed multiple cycles
            // Safety break just in case logic fails (e.g. interval=0)
            let loops = 0;
            while (nextDate <= now && loops < 1000) {
                nextDate = calculateNextRun(
                    nextDate,
                    recurrence.frequency,
                    recurrence.interval,
                    recurrence.daysOfWeek,
                    recurrence.dayOfMonth
                );
                loops++;
            }

            if (loops >= 1000) {
                console.error(`Infinite loop detected calculating next run for recurrence ${recurrence.id}. Aborting update.`);
                continue;
            }

            // 4. Update the recurrence
            // Check if past endDate
            if (recurrence.endDate && nextDate > recurrence.endDate) {
                // Option: Delete recurrence or mark inactive? 
                // For now, we update it; the query filter handles excluding it next time.
                // Or we could leave it as is.
            }

            await prisma.recurrence.update({
                where: { id: recurrence.id },
                data: { nextRunAt: nextDate },
            });

        } catch (err) {
            console.error(`Failed to process recurrence ${recurrence.id}:`, err);
        }
    }
}

function calculateNextRun(
    current: Date,
    frequency: string,
    interval: number,
    daysOfWeek: number[],
    dayOfMonth: number | null
): Date {
    const next = new Date(current);

    // Prevent infinite loops if interval is 0 or negative
    const safeInterval = interval && interval > 0 ? interval : 1;

    if (frequency === 'daily') {
        next.setDate(next.getDate() + safeInterval);
    } else if (frequency === 'weekly') {
        // daysOfWeek: 0-6 (Sun-Sat)
        if (!daysOfWeek || daysOfWeek.length === 0) {
            // Fallback: just add weeks if no specific days
            next.setDate(next.getDate() + (safeInterval * 7));
            return next;
        }

        const currentDay = next.getDay();
        const sortedDays = [...daysOfWeek].sort((a, b) => a - b);

        // Find scheduled day later in the current week
        const nextDay = sortedDays.find((d) => d > currentDay);

        if (nextDay !== undefined) {
            // Allow moving to a day in the same week
            next.setDate(next.getDate() + (nextDay - currentDay));
        } else {
            // Move to the first available day in the next interval
            // 1. Go to start of next week (Sunday)
            // 2. Add (interval - 1) weeks
            // 3. Add offset to first scheduled day

            const firstDay = sortedDays[0];

            // Days to end of current week (Sat) + 1 = next Sun
            const daysToNextSun = 7 - currentDay;

            // Total days to add
            const daysToAdd = daysToNextSun + (7 * (safeInterval - 1)) + firstDay;
            // Note: If interval=1 (next week), we add daysToNextSun + firstDay.
            // Example: Current=Wed(3), Target=Mon(1), Interval=1.
            // daysToNextSun = 4 (to Sun). + 0 (weeks) + 1 (Mon) = 5 days.
            // Wed + 5 = Mon. Correct.

            next.setDate(next.getDate() + daysToAdd);
        }
    } else if (frequency === 'monthly') {
        // Standard addition of months
        next.setMonth(next.getMonth() + safeInterval);

        if (dayOfMonth) {
            // Try to set to the specific day
            // If the month doesn't have that day (e.g. Feb 30), we should clamp to the last day of the month
            // or let it drift (JS default drifts).
            // Let's implement clamping which is more intuitive for "Monthly on the 31st" -> "Feb 28/29"

            // Get the maximum days in the target month
            // new Date(year, month + 1, 0).getDate() gives last day of month
            const year = next.getFullYear();
            const month = next.getMonth(); // 0-11
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            const targetDay = Math.min(dayOfMonth, daysInMonth);
            next.setDate(targetDay);
        }
    }

    return next;
}
