import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

import { SKILL_ALIASES } from "../lib/skills.js";

type AllocationDecision = {
  taskId: string;
  userId: string;
};

/**
 * PURE FUNCTION
 * Decides who SHOULD get which task.
 * No DB. No side effects. Deterministic.
 */
function computeAllocations(
  tasks: { id: string; requiredSkill: string | null }[],
  members: { id: string; skills: string[]; workload: number }[]
): AllocationDecision[] {

  const decisions: AllocationDecision[] = [];

  for (const task of tasks) {
    // Normalization helper
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

    const requiredRaw = task.requiredSkill || "";
    if (!requiredRaw) continue;

    const requiredNorm = normalize(requiredRaw);

    // Get aliases
    const aliases = SKILL_ALIASES[task.requiredSkill!] || [];
    const targetSet = new Set([requiredNorm, ...aliases.map(normalize)]);

    let candidates = members
      .filter(m => {
        // Check 1: Alias / Exact Match
        const hasDirectMatch = m.skills.some(userSkill =>
          targetSet.has(normalize(userSkill))
        );
        if (hasDirectMatch) return true;

        // Check 2: Loose Substring Match (e.g. "ReactJS" matches "React")
        return m.skills.some(userSkill => {
          const uNorm = normalize(userSkill);
          return uNorm.includes(requiredNorm) || requiredNorm.includes(uNorm);
        });
      })
      .sort((a, b) => a.workload - b.workload);

    // Fallback: Assign to ANY member with lowest workload if no skill match
    if (candidates.length === 0) {
      candidates = [...members].sort((a, b) => a.workload - b.workload);
    }

    if (candidates.length === 0) continue;

    const chosen = candidates[0];

    decisions.push({
      taskId: task.id,
      userId: chosen.id
    });

    // In-memory workload update
    chosen.workload += 1;
  }

  return decisions;
}

export const allocateTasksForTeam = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    if (!teamId) {
      return res.status(400).json({ error: "teamId is required" });
    }

    // @ts-ignore
    const requesterId = req.user?.id;

    // 1️⃣ Fetch data (Reads) OUTSIDE transaction to avoid timeouts
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          select: { id: true, skills: true, workload: true }
        }
      }
    });

    if (!team) {
      throw new Error("Team not found");
    }

    if (team.leaderId !== requesterId) {
      throw new Error("Only team leader can run allocation");
    }

    if (!team.members || team.members.length === 0) {
      throw new Error("No members in team");
    }

    const members = team.members;

    const pendingTasks = await prisma.task.findMany({
      where: {
        teamId,
        status: "pending"
      }
    });

    if (pendingTasks.length === 0) {
      return res.status(200).json({
        message: "No pending tasks",
        allocations: []
      });
    }

    // Defensive defaults
    for (const m of members) {
      if (!Array.isArray(m.skills)) m.skills = [];
    }

    // 2️⃣ PURE allocation decision
    const decisions = computeAllocations(pendingTasks, members);

    const allocations: { taskId: string; assignedTo: string }[] = [];
    const workloadIncrements = new Map<string, number>();

    // 3️⃣ Write Phase (Transaction)
    await prisma.$transaction(async (tx) => {

      // Commit decisions
      for (const decision of decisions) {

        const claim = await tx.task.updateMany({
          where: {
            id: decision.taskId,
            status: "pending" // concurrency guard
          },
          data: {
            assignedToId: decision.userId,
            status: "active"
          }
        });

        if (claim.count === 0) {
          // Task already taken
          continue;
        }

        workloadIncrements.set(
          decision.userId,
          (workloadIncrements.get(decision.userId) ?? 0) + 1
        );

        allocations.push({
          taskId: decision.taskId,
          assignedTo: decision.userId
        });
      }

      // Apply workload updates (batched)
      for (const [userId, increment] of workloadIncrements) {
        await tx.user.update({
          where: { id: userId },
          data: {
            workload: { increment }
          }
        });
      }
    }, {
      timeout: 10000 // 10s timeout
    });

    res.status(200).json({
      message: `Allocated ${allocations.length} tasks`,
      allocations
    });

  } catch (err) {
    console.error("Error allocating tasks:", err);
    res.status(500).json({ error: "Allocation failed" });
  }
};
