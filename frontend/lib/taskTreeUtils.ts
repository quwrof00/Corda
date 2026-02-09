import { Task } from "@/hooks/useTasks";

/**
 * Builds a hierarchical tree structure from a flat list of tasks.
 * Tasks with parentId will be nested under their parent's children array.
 */
export function buildTaskTree(tasks: Task[]): Task[] {
    const taskMap = new Map<string, Task>();
    const roots: Task[] = [];

    // Create a shallow copy of tasks with initialized children array
    const tasksWithChildren = tasks.map(t => ({ ...t, children: [] as Task[] }));

    // Map IDs to task objects
    tasksWithChildren.forEach(task => {
        taskMap.set(task.id, task);
    });

    // Build hierarchy
    tasksWithChildren.forEach(task => {
        // If task has a parent AND that parent is in the current filtered list, add as child
        if (task.parentId && taskMap.has(task.parentId)) {
            taskMap.get(task.parentId)!.children!.push(task);
        } else {
            // Otherwise treat as root for the current view
            roots.push(task);
        }
    });

    return roots;
}

/**
 * Flattens a hierarchical tree into a flat list for rendering.
 * Only includes children of expanded nodes based on expandedIds set.
 * Each task gets a 'level' property indicating its depth in the tree.
 */
export function flattenTree(
    tasks: Task[],
    expandedIds: Set<string>,
    level = 0,
    result: (Task & { level: number })[] = []
): (Task & { level: number })[] {
    for (const task of tasks) {
        result.push({ ...task, level });
        if (task.children && task.children.length > 0 && expandedIds.has(task.id)) {
            flattenTree(task.children, expandedIds, level + 1, result);
        }
    }
    return result;
}
