import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/session";
import { computeAllocations } from "@/lib/allocator";

export async function POST(
    req: Request,
    props: { params: Promise<{ teamId: string }> }
) {
    try {
        const params = await props.params;
        const { teamId } = params;
        const user = await getCurrentUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Fetch outside transaction
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                members: {
                    select: { id: true, skills: true, workload: true }
                }
            }
        });

        if (!team) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }

        if (team.leaderId !== user.id) {
            return NextResponse.json({ error: "Only team leader can run allocation" }, { status: 403 });
        }

        if (!team.members || team.members.length === 0) {
            return NextResponse.json({ error: "No members in team" }, { status: 400 });
        }

        const members = team.members;

        const pendingTasks = await prisma.task.findMany({
            where: {
                teamId,
                status: "pending"
            }
        });

        if (pendingTasks.length === 0) {
            return NextResponse.json({
                message: "No pending tasks",
                allocations: []
            });
        }

        // Defensive defaults
        for (const m of members) {
            if (!Array.isArray(m.skills)) m.skills = [];
        }

        // PURE decision phase
        const decisions = computeAllocations(pendingTasks, members);

        const allocations: { taskId: string; assignedTo: string }[] = [];
        const workloadIncrements = new Map<string, number>();

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {

            for (const decision of decisions) {

                const claim = await tx.task.updateMany({
                    where: {
                        id: decision.taskId,
                        status: "pending"
                    },
                    data: {
                        assignedToId: decision.userId,
                        status: "active"
                    }
                });

                if (claim.count === 0) continue;

                workloadIncrements.set(
                    decision.userId,
                    (workloadIncrements.get(decision.userId) ?? 0) + 1
                );

                allocations.push({
                    taskId: decision.taskId,
                    assignedTo: decision.userId
                });
            }

            for (const [userId, increment] of workloadIncrements) {
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        workload: { increment }
                    }
                });
            }
        }, { timeout: 10000 });

        return NextResponse.json({
            message: `Allocated ${allocations.length} tasks`,
            allocations
        });

    } catch (error) {
        console.error("Error allocating tasks:", error);
        return NextResponse.json({ error: "Allocation failed" }, { status: 500 });
    }
}
