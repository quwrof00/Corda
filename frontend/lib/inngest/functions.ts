import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { computeAllocations, AllocationDecision } from "@/lib/allocator";
import { Prisma } from "@prisma/client";

export const allocateTeam = inngest.createFunction(
    {
        id: "allocate-team",
        // 4️⃣ Worker Step 1 — Acquire lock (via Inngest concurrency)
        concurrency: {
            limit: 1,
            key: "event.data.teamId"
        }
    },
    { event: "team.allocate.requested" },
    async ({ event, step }) => {
        const { teamId } = event.data;

        // 5️⃣ Worker Step 2 — Fetch fresh state
        const { team, pendingTasks } = await step.run("fetch-state", async () => {
            const team = await prisma.team.findUnique({
                where: { id: teamId },
                include: {
                    members: {
                        select: { id: true, skills: true, workload: true }
                    }
                }
            });

            if (!team) throw new Error("Team not found");

            const pendingTasks = await prisma.task.findMany({
                where: {
                    teamId,
                    status: "pending"
                }
            });

            return { team, pendingTasks };
        });

        if (pendingTasks.length === 0) {
            return { message: "No pending tasks" };
        }

        // Defensive defaults for skills
        const members = team.members.map(m => ({
            ...m,
            skills: Array.isArray(m.skills) ? m.skills : []
        }));

        // 6️⃣ Worker Step 3 — Compute allocations (pure)
        const decisions: AllocationDecision[] = await step.run("compute-allocations", () => {
            return computeAllocations(pendingTasks, members);
        });

        if (decisions.length === 0) {
            return { message: "No allocations possible" };
        }

        // 7️⃣ Worker Step 4 — Apply results
        const allocations = await step.run("apply-results", async () => {
            const results: { taskId: string; assignedTo: string }[] = [];
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

                    results.push({
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

            return results;
        });

        // 8️⃣ Worker Step 5 — Emit events
        await step.run("emit-events", async () => {
            const events = allocations.map(a => ({
                name: "task.assigned",
                data: {
                    taskId: a.taskId,
                    userId: a.assignedTo,
                    teamId
                }
            }));

            if (events.length > 0) {
                await inngest.send(events);
            }

            await inngest.send({
                name: "allocation.completed",
                data: {
                    teamId,
                    count: allocations.length
                }
            });
        });

        return { allocated: allocations.length, allocations };
    }
);
