import { SKILL_ALIASES } from "./skills";

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

        if (!requiredRaw) {
            // No skill required -> lowest simulated workload
            candidates = [...members].sort(
                (a, b) => workload.get(a.id)! - workload.get(b.id)!
            );
        } else {
            const requiredNorm = normalize(requiredRaw);

            const aliases = SKILL_ALIASES[task.requiredSkill!] || [];
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
                .sort((a, b) => workload.get(a.id)! - workload.get(b.id)!);

            // Fallback if no one matches
            if (candidates.length === 0) {
                candidates = [...members].sort(
                    (a, b) => workload.get(a.id)! - workload.get(b.id)!
                );
            }
        }

        if (candidates.length === 0) continue;

        const chosen = candidates[0];

        decisions.push({
            taskId: task.id,
            userId: chosen.id
        });

        // Update only the shadow workload
        workload.set(chosen.id, workload.get(chosen.id)! + 1);
    }

    return decisions;
}
