export interface Member {
    id: string;
    name: string;
    email: string;
    skills?: string[];
}

export interface Task {
    id: string;
    title: string;
    desc?: string;
    description?: string;
    status: string;
    priority: string;
    requiredSkill?: string | null;
    assignedTo?: { id: string; name: string } | null;
    assignedToId?: string;
    deadline?: string;
    createdAt?: string;
    parentId?: string | null;
    children?: Task[];
    source?: string;
    recurrenceId?: string | null;
    team?: { id?: string; name?: string;[key: string]: unknown } | null;
    [key: string]: unknown;
}

export interface Team {
    id: string;
    name: string;
    desc?: string;
    leader?: { email: string };
    enableAll?: boolean;
    scratchpad?: string;
}
