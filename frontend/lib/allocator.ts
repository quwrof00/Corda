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
