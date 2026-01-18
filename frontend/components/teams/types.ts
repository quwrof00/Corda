export interface Member {
    id: string;
    name: string;
    email: string;
    skills?: string[];
}

export interface Task {
    id: string;
    title: string;
    desc?: string; // Optional because API might return it but not always populated or used? In the page it was desc?: string
    status: string;
    priority: string;
    requiredSkill?: string | null;
    assignedTo?: { id: string; name: string };
    assignedToId?: string | null;
    deadline?: string;
}

export interface Team {
    id: string;
    name: string;
    desc?: string;
    leader?: { email: string };
}
