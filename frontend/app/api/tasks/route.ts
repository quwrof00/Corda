import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getCanonicalSkill, formatSkill } from "@/lib/skills";
import { publishTeamEvent } from "@/lib/socket";

// GET /api/tasks - Get all tasks assigned to current user
export async function GET(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, Number(searchParams.get("page") || "1"));
        const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || "20")));
        const sortBy = searchParams.get("sortBy") || "newest";
        const status = searchParams.get("status");
        const teamId = searchParams.get("teamId");
        const priority = searchParams.get("priority");
        const dateFilter = searchParams.get("dateFilter");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const where: Record<string, unknown> = {
            assignedToId: user.id,
        };

        if (teamId && teamId !== "all") {
            where.teamId = teamId;
        }

        if (priority && priority !== "all") {
            where.priority = priority;
        }

        if (status && status !== "All") {
            if (status === "Todo") {
                where.status = { in: ["pending", "to-do"] };
            } else if (status === "In Progress") {
                where.status = { in: ["active", "in-progress"] };
            } else if (status === "Blocked") {
                where.status = "blocked";
            } else if (status === "Done") {
                where.status = "completed";
            }
        }

        if (dateFilter && dateFilter !== "all") {
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endOfToday = new Date(startOfToday);
            endOfToday.setDate(endOfToday.getDate() + 1);
            const endOfWeek = new Date(startOfToday);
            endOfWeek.setDate(endOfWeek.getDate() + 7);

            if (dateFilter === "today") {
                where.deadline = {
                    gte: startOfToday,
                    lt: endOfToday,
                };
            } else if (dateFilter === "week") {
                where.deadline = {
                    gte: startOfToday,
                    lt: endOfWeek,
                };
            } else if (dateFilter === "overdue") {
                where.deadline = {
                    lt: startOfToday,
                };
                where.status = {
                    not: "completed",
                };
            } else if (dateFilter === "custom" && startDate && endDate) {
                const customStart = new Date(startDate);
                const customEnd = new Date(endDate);
                customEnd.setHours(23, 59, 59, 999);
                where.deadline = {
                    gte: customStart,
                    lte: customEnd,
                };
            }
        }

        let tasks;
        let total;

        if (sortBy === "priority") {
            const allTasks = await prisma.task.findMany({
                where,
                include: {
                    team: true,
                    assignedTo: {
                        select: { id: true, name: true, email: true }
                    }
                }
            });

            const priorityRank: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
            const sortedTasks = allTasks.sort((a, b) => {
                const rankDiff = (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99);
                if (rankDiff !== 0) return rankDiff;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

            total = sortedTasks.length;
            const start = (page - 1) * limit;
            tasks = sortedTasks.slice(start, start + limit);
        } else {
            const orderBy =
                sortBy === "deadline"
                    ? [{ deadline: "asc" as const }, { createdAt: "desc" as const }]
                    : [{ createdAt: "desc" as const }];

            const [pagedTasks, count] = await Promise.all([
                prisma.task.findMany({
                    where,
                    include: {
                        team: true,
                        assignedTo: {
                            select: { id: true, name: true, email: true }
                        }
                    },
                    orderBy,
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                prisma.task.count({ where }),
            ]);

            tasks = pagedTasks;
            total = count;
        }

        return NextResponse.json({
            items: tasks,
            page,
            limit,
            total,
            hasMore: page * limit < total,
            nextPage: page * limit < total ? page + 1 : null,
        });
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }
}

// POST /api/tasks - Create a new task
export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const {
            title,
            description,
            deadline,
            requiredSkill,
            priority,
            assignedToId,
            teamId,
            status = "pending",
            parentId,
            recurrence, // { frequency, interval, daysOfWeek, endDate }
        } = await req.json();

        if (!teamId || !title || !deadline) {
            return NextResponse.json({ error: "Missing required fields (title, teamId, deadline)" }, { status: 400 });
        }

        interface TeamType {
            id: string;
            leaderId: string | null;
            enableAll: boolean;
        }

        const team = await prisma.team.findUnique({
            where: { id: teamId },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            select: { id: true, leaderId: true, enableAll: true } as any
        }) as unknown as TeamType;

        if (!team) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }

        if (team.leaderId !== user.id && !team.enableAll) {
            return NextResponse.json({ error: "Only team leader can create tasks" }, { status: 403 });
        }

        let recurrenceId: string | null = null;

        if (recurrence) {
            // Calculate initial nextRunAt
            // For the first task, we are creating it right now.
            // The recurrence schedule governs when the *next* one is created.
            // So we need to calculate the next run date based on the current deadline (or today) + interval.

            // We'll import the calculation logic or replicate it simply here.
            // Importing from lib/cron might trigger the cron init if not careful, but lib/cron exports utils.
            // Let's rely on a helper or just do simple calculation here to avoid circular deps/side effects if initCron is top level.
            // Actually initCron is a function, so importing is safe.

            // However, to keep it self-contained and safe:
            const firstDeadline = new Date(deadline);
            const nextRunAt = new Date(firstDeadline);

            const { frequency, interval, daysOfWeek, dayOfMonth } = recurrence;
            const safeInterval = interval && interval > 0 ? interval : 1;

            if (frequency === 'daily') {
                nextRunAt.setDate(nextRunAt.getDate() + safeInterval);
            } else if (frequency === 'weekly') {
                if (!daysOfWeek || daysOfWeek.length === 0) {
                    nextRunAt.setDate(nextRunAt.getDate() + (safeInterval * 7));
                } else {
                    // For the very first "next run", we need to see if there's another occurrence *this week* 
                    // after the current deadline day, or if we jump to next interval.
                    // IMPORTANT: The logic regarding "current task is the template" means 
                    // nextRunAt should be the date we want the *system* to generate the *next* task.
                    // Usually that's the day OF the next task's deadline, or slightly before?
                    // Our cron logic creates the task *on* the nextRunAt date, setting deadline = now + duration.
                    // So nextRunAt should be the DATE of the next occurrence.

                    // Logic replicated from cron.ts (simplified for "next after deadline")
                    const currentDay = nextRunAt.getDay();
                    const sortedDays = [...daysOfWeek].sort((a: number, b: number) => a - b);
                    const nextDay = sortedDays.find((d) => d > currentDay);

                    if (nextDay !== undefined) {
                        nextRunAt.setDate(nextRunAt.getDate() + (nextDay - currentDay));
                    } else {
                        const firstDay = sortedDays[0];
                        const daysToNextSun = 7 - currentDay;
                        const daysToAdd = daysToNextSun + (7 * (safeInterval - 1)) + firstDay;
                        nextRunAt.setDate(nextRunAt.getDate() + daysToAdd);
                    }
                }
            } else if (frequency === 'monthly') {
                nextRunAt.setMonth(nextRunAt.getMonth() + safeInterval);
                if (dayOfMonth) {
                    const year = nextRunAt.getFullYear();
                    const month = nextRunAt.getMonth();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    nextRunAt.setDate(Math.min(dayOfMonth, daysInMonth));
                }
            }

            const newRecurrence = await prisma.recurrence.create({
                data: {
                    frequency,
                    interval: safeInterval,
                    daysOfWeek: daysOfWeek || [],
                    dayOfMonth: dayOfMonth || null,
                    endDate: recurrence.endDate ? new Date(recurrence.endDate) : null,
                    nextRunAt,
                }
            });
            recurrenceId = newRecurrence.id;
        }

        const newTask = await prisma.task.create({
            data: {
                title,
                desc: description,
                deadline: new Date(deadline),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                requiredSkill: requiredSkill ? (getCanonicalSkill(requiredSkill) || formatSkill(requiredSkill)) : (null as any),
                priority,
                status,
                teamId,
                assignedToId: assignedToId || null,
                parentId: parentId || null,
                recurrenceId: recurrenceId,
            }
        });

        // Real-time notification
        await publishTeamEvent(teamId, {
            type: "TASK_CREATED",
            payload: newTask,
            meta: { triggeredBy: user.id }
        });

        return NextResponse.json(newTask, { status: 201 });
    } catch (error) {
        console.error("Error creating task:", error);
        return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }
}
