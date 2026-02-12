import { NextResponse } from 'next/server';
import { acquireAutoAllocLock, releaseAutoAllocLock, getAutoAllocRunner } from '@/lib/redis-locks';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { computeAllocations } from '@/lib/allocator';

export async function POST(req: Request, props: { params: Promise<{ teamId: string }> }) {
    const params = await props.params;
    const { teamId } = params;

    // Parse body
    let body;
    try {
        body = await req.json();
    } catch {
        body = {};
    }
    const { taskId, userId } = body;

    // 1. Try to acquire lock atomically
    console.log(`[DEBUG-ALLOC] Request for Team: ${teamId}, User: ${userId}`);
    const acquired = await acquireAutoAllocLock(teamId, userId ? String(userId) : "system");
    console.log(`[DEBUG-ALLOC] Lock Acquired: ${acquired}`);

    if (!acquired) {
        const runner = await getAutoAllocRunner(teamId);
        return NextResponse.json(
            { error: `Allocation already in progress by user ${runner}` },
            { status: 409 }
        );
    }

    try {
        // 2. Broadcast "started" to team
        await redis.publish(`team:${teamId}:updates`, JSON.stringify({
            type: 'autoalloc_started',
            byUser: userId,
            taskId // Optional: if specific task
        }));

        // 3. Run allocation logic (sync, fast)
        // Fetch team members
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: { members: { include: { assignedTasks: true } } } // Fetch assigned tasks for workload
        });

        if (!team) throw new Error("Team not found");

        // Fetch task(s) to allocate
        let tasksToAllocate = [];
        if (taskId) {
            const t = await prisma.task.findUnique({ where: { id: taskId } });
            if (t) tasksToAllocate.push(t);
        } else {
            // Bulk allocation for all unassigned
            tasksToAllocate = await prisma.task.findMany({
                where: {
                    teamId: teamId,
                    assignedToId: null,
                    status: { notIn: ['done', 'cancelled', 'completed'] }
                }
            });
        }

        if (tasksToAllocate.length > 0) {
            // Prepare data for allocator
            // We need workload count. 
            // We can do a quick aggregation or use the loaded relations.
            // Let's use aggregation for accuracy if `assignedTasks` is large, 
            // but `include: assignedTasks` is fine for small teams.
            // Better: Use `count` aggregation.
            const workloadData = await prisma.task.groupBy({
                by: ['assignedToId'],
                where: {
                    teamId: teamId,
                    status: { notIn: ['done', 'cancelled', 'completed'] },
                    assignedToId: { not: null }
                },
                _count: { id: true }
            });

            const workloadMap = new Map<string, number>();
            workloadData.forEach(w => {
                if (w.assignedToId) workloadMap.set(w.assignedToId, w._count.id);
            });

            const membersForAllocator = team.members.map(m => ({
                id: m.id,
                skills: m.skills,
                workload: workloadMap.get(m.id) || 0
            }));

            const tasksInput = tasksToAllocate.map(t => ({
                id: t.id,
                requiredSkill: t.requiredSkill
            }));

            const decisions = computeAllocations(tasksInput, membersForAllocator);

            // Apply updates
            if (decisions.length > 0) {
                await prisma.$transaction(
                    decisions.map(d =>
                        prisma.task.update({
                            where: { id: d.taskId },
                            data: { assignedToId: d.userId }
                        })
                    )
                );

                // 4. Broadcast final result
                // If single task, use specific event format
                if (taskId && decisions.length === 1) {
                    await redis.publish(`team:${teamId}:updates`, JSON.stringify({
                        type: 'task_reallocated', // User's event name
                        taskId: decisions[0].taskId,
                        newAssignee: decisions[0].userId,
                        byUser: userId
                    }));
                } else {
                    // Bulk event
                    await redis.publish(`team:${teamId}:updates`, JSON.stringify({
                        type: 'allocation_completed',
                        count: decisions.length,
                        decisions,
                        byUser: userId
                    }));
                }
            } else {
                // No decisions made
                await redis.publish(`team:${teamId}:updates`, JSON.stringify({
                    type: 'allocation_completed',
                    count: 0,
                    byUser: userId
                }));
            }

            return NextResponse.json({ success: true, allocated: decisions.length });
        } else {
            return NextResponse.json({ success: true, allocated: 0, message: "No tasks to allocate" });
        }

    } catch (error) {
        console.error("Allocation error:", error);
        await redis.publish(`team:${teamId}:updates`, JSON.stringify({
            type: 'allocation_error',
            message: "Failed to allocate",
            byUser: userId
        }));
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        // 5. Always release lock
        await releaseAutoAllocLock(teamId, userId ? String(userId) : "system");
    }
}
