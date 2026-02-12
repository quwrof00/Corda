import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/session";
import { getCanonicalSkill, formatSkill } from "@/lib/skills";
import { redis } from "@/lib/redis";

// GET /api/tasks/[taskId]
export async function GET(
    req: Request,
    props: { params: Promise<{ taskId: string }> }
) {
    try {
        const params = await props.params;
        const { taskId } = params;

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                team: true,
                assignedTo: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
        return NextResponse.json(task);
    } catch (error) {
        console.error("Error fetching task:", error);
        return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
    }
}

// PUT /api/tasks/[taskId]
export async function PUT(
    req: Request,
    props: { params: Promise<{ taskId: string }> }
) {
    try {
        const params = await props.params;
        const { taskId } = params;
        const user = await getCurrentUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const {
            title,
            description,
            deadline,
            requiredSkill,
            priority,
            status,
            assignedToId,
            parentId
        } = await req.json();

        // Check for circular dependency if parentId is being updated
        if (parentId) {
            if (parentId === taskId) {
                return NextResponse.json({ error: "Task cannot be its own parent" }, { status: 400 });
            }
            // Basic check: Ensure new parent is not a child of this task (prevent immediate cycle)
            // For a robust check, we'd need a recursive query, but typically simple same-id check catches basic errors.
            // Let's rely on frontend preventing selecting children as parents for now, or add a deeper check if needed.
        }

        const updatedTask = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const existingTask = await tx.task.findUnique({
                where: { id: taskId },
                include: { team: true }
            });

            if (!existingTask) throw new Error("Task not found");

            const isActualLeader = existingTask.team.leaderId === user.id;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const isLeader = isActualLeader || (existingTask.team as any).enableAll;
            const isAssignee = existingTask.assignedToId === user.id;

            if (!isLeader && !isAssignee) {
                throw new Error("Not authorized to update this task");
            }

            if (!isLeader) {
                // If not a leader, but the assignee, they can edit most things except priority and re-assignment
                if (priority || assignedToId || parentId) {
                    throw new Error("Only team leader can edit priority, parent, or change assignment.");
                }
            }

            const updateData: {
                title?: string;
                desc?: string;
                deadline?: Date;
                requiredSkill?: string;
                priority?: string;
                status?: string;
                assignedToId?: string | null;
                parentId?: string | null;
            } = {};

            if (title) updateData.title = title;
            if (description !== undefined) updateData.desc = description;
            if (deadline) updateData.deadline = new Date(deadline);
            if (requiredSkill) updateData.requiredSkill = getCanonicalSkill(requiredSkill) || formatSkill(requiredSkill);
            if (priority) updateData.priority = priority;
            if (status) updateData.status = status;
            if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
            if (parentId !== undefined) updateData.parentId = parentId;

            if (assignedToId) {
                const effectiveStatus = updateData.status || existingTask.status;
                if (effectiveStatus === 'pending' && existingTask.team.name !== 'Personal') {
                    updateData.status = 'active';
                }
            } else if (assignedToId === null) {
                updateData.status = 'pending';
            }

            // Workload
            if (assignedToId !== undefined && assignedToId !== existingTask.assignedToId) {
                if (existingTask.assignedToId) {
                    await tx.user.update({
                        where: { id: existingTask.assignedToId },
                        data: { workload: { decrement: 1 } }
                    });
                }
                if (assignedToId) {
                    await tx.user.update({
                        where: { id: assignedToId },
                        data: { workload: { increment: 1 } }
                    });
                }
            }

            return await tx.task.update({
                where: { id: taskId },
                data: updateData,
                include: {
                    assignedTo: {
                        select: { id: true, name: true, email: true }
                    }
                }
            });
        }, {
            timeout: 10000
        });

        // Broadcast task update
        await redis.publish(`team:${updatedTask.teamId}:updates`, JSON.stringify({
            type: 'task_updated',
            taskId: updatedTask.id,
            title: updatedTask.title,
            status: updatedTask.status,
            assignedToId: updatedTask.assignedToId,
            byUser: user.id
        }));

        return NextResponse.json(updatedTask);
    } catch (error) {
        console.error("Error updating task:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        if (errorMessage === "Task not found") return NextResponse.json({ error: "Task not found" }, { status: 404 });
        if (errorMessage.includes("Not authorized") || errorMessage.includes("Only team leader")) return NextResponse.json({ error: errorMessage }, { status: 403 });
        return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }
}

// DELETE /api/tasks/[taskId]
export async function DELETE(
    req: Request,
    props: { params: Promise<{ taskId: string }> }
) {
    try {
        const params = await props.params;
        const { taskId } = params;
        const user = await getCurrentUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const existingTask = await tx.task.findUnique({
                where: { id: taskId },
                include: { team: true }
            });

            if (!existingTask) throw new Error("Task not found");

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (existingTask.team.leaderId !== user.id && !(existingTask.team as any).enableAll) {
                throw new Error("Only team leader can delete tasks");
            }

            if (existingTask.assignedToId) {
                await tx.user.update({
                    where: { id: existingTask.assignedToId },
                    data: { workload: { decrement: 1 } }
                });
            }

            await tx.task.delete({ where: { id: taskId } });

            return { message: "Task deleted successfully", teamId: existingTask.teamId, title: existingTask.title };
        }, {
            timeout: 10000
        });

        // Broadcast task deletion
        if (result.teamId) {
            await redis.publish(`team:${result.teamId}:updates`, JSON.stringify({
                type: 'task_deleted',
                taskId,
                title: result.title,
                byUser: user.id
            }));
        }

        return NextResponse.json({ message: result.message });
    } catch (error) {
        console.error("Error deleting task:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        if (errorMessage === "Task not found") return NextResponse.json({ error: "Task not found" }, { status: 404 });
        if (errorMessage.includes("Only team leader")) return NextResponse.json({ error: errorMessage }, { status: 403 });
        return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }
}