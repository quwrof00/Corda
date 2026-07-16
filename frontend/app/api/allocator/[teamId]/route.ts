import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/session";
import { computeAllocations } from "@/lib/allocator";
import { publishTeamEvent } from "@/lib/socket";

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
        interface TeamType {
            id: string;
            name: string;
            leaderId: string | null;
            enableAll: boolean;
        }

        const team = await prisma.team.findUnique({
            where: { id: teamId },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            select: { id: true, name: true, leaderId: true, enableAll: true } as any
        }) as unknown as TeamType;

        if (!team) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }

        // Fetch ALL members with their TEAM-SPECIFIC workload
        const members = await prisma.user.findMany({
            where: {
                OR: [
                    { teams: { some: { id: teamId } } },
                    { leadingTeams: { some: { id: teamId } } }
                ]
            },
            select: {
                id: true,
                skills: true,
                assignedTasks: {
                    where: {
                        teamId: teamId,
                        status: { not: 'completed' }
                    },
                    select: { id: true }
                }
            }
        }).then(users => users.map(u => ({
            id: u.id,
            skills: u.skills,
            workload: u.assignedTasks.length // Team-specific workload
        })));

        if (team.leaderId !== user.id && !team.enableAll) {
            return NextResponse.json({ error: "Only team leader can run allocation" }, { status: 403 });
        }

        if (!members || members.length === 0) {
            return NextResponse.json({ error: "No members in team" }, { status: 400 });
        }

        const pendingTasks = await prisma.task.findMany({
            where: {
                teamId,
                status: "pending",
                assignedToId: null
            }
        });

        if (pendingTasks.length === 0) {
            return NextResponse.json({
                message: "No pending tasks",
                allocations: []
            });
        }
        console.log(`[Allocator API] Team: ${teamId}, Members count: ${members.length}`);
        console.log(`[Allocator API] Members: ${JSON.stringify(members.map((m: { id: string; workload: number; skills: string[] }) => ({ id: m.id, workload: m.workload, skills: m.skills })))}`);
        console.log(`[Allocator API] Pending Tasks count: ${pendingTasks.length}`);

        // Defensive defaults
        for (const m of members) {
            if (!Array.isArray(m.skills)) m.skills = [];
        }

        // PURE decision phase
        const decisions = computeAllocations(pendingTasks, members);
        console.log(`[Allocator API] Decisions: ${JSON.stringify(decisions)}`);

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

        // Real-time notification
        await publishTeamEvent(teamId, {
            type: "ALLOCATION_UPDATE",
            payload: { count: allocations.length, allocations },
            meta: { triggeredBy: user.id }
        });

        return NextResponse.json({
            message: `Allocated ${allocations.length} tasks`,
            allocations
        });

    } catch (error) {
        console.error("Error allocating tasks:", error);
        return NextResponse.json({ error: "Allocation failed" }, { status: 500 });
    }
}
