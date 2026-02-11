import { SKILL_ALIASES, getCanonicalSkill } from "./skills";

export type AllocationDecision = {
    taskId: string;
    userId: string;
};

/**
 * PURE FUNCTION
 * Decides who SHOULD get which task.
 * No DB. No side effects. Deterministic.
 */
export function computeAllocations(
    tasks: { id: string; requiredSkill: string | null }[],
    members: { id: string; skills: string[]; workload: number }[]
): AllocationDecision[] {

    const decisions: AllocationDecision[] = [];

    // Shadow workload map (never mutate Prisma objects)
    const workload = new Map<string, number>();
    for (const m of members) {
        workload.set(m.id, m.workload);
    }

    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

    for (const task of tasks) {
        let candidates: typeof members = [];

        const requiredRaw = task.requiredSkill || "";
        console.log(`[Allocator] Processing task: ${task.id}, Required Skill: "${requiredRaw}"`);

        if (!requiredRaw) {
            // No skill required -> lowest simulated workload
            candidates = [...members].sort(
                (a, b) => (workload.get(a.id) ?? 0) - (workload.get(b.id) ?? 0)
            );
        } else {
            const requiredNorm = normalize(requiredRaw);
            const canonical = getCanonicalSkill(requiredRaw);
            const aliases = canonical ? (SKILL_ALIASES[canonical] || []) : [];
            const targetSet = new Set([requiredNorm, ...aliases.map(normalize)]);

            candidates = members
                .filter(m => {
                    const hasDirectMatch = m.skills.some(skill =>
                        targetSet.has(normalize(skill))
                    );
                    if (hasDirectMatch) return true;

                    return m.skills.some(skill => {
                        const u = normalize(skill);
                        return u.includes(requiredNorm) || requiredNorm.includes(u);
                    });
                })
                .sort((a, b) => (workload.get(a.id) ?? 0) - (workload.get(b.id) ?? 0));

            // Fallback if no one matches the skill accurately
            if (candidates.length === 0) {
                console.log(`[Allocator] No skill match for "${requiredRaw}", falling back to all members`);
                candidates = [...members].sort(
                    (a, b) => (workload.get(a.id) ?? 0) - (workload.get(b.id) ?? 0)
                );
            }
        }

        if (candidates.length === 0) {
            console.log(`[Allocator] No candidates found for task ${task.id}`);
            continue;
        }

        const chosen = candidates[0];
        const currentW = workload.get(chosen.id) ?? 0;

        console.log(`[Allocator] Assigned task ${task.id} to user ${chosen.id}. (Workload before: ${currentW})`);

        decisions.push({
            taskId: task.id,
            userId: chosen.id
        });

        // Update only the shadow workload
        workload.set(chosen.id, currentW + 1);
    }

    console.log("[Allocator] Final simulated workloads:", Object.fromEntries(workload));
    return decisions;
}
