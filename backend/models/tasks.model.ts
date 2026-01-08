export interface Task {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  requiredSkills: string[];
  priority: "low" | "medium" | "high";
  assignedTo?: string; // user id
  teamId: string;
  status: "pending" | "in-progress" | "completed";
  createdAt: string;
  updatedAt: string;
}
