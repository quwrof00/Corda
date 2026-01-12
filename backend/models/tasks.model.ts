export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  requiredSkill: string;
  priority: "low" | "medium" | "high";
  assignedTo?: string; // user id
  teamId: string;
  status: "pending" | "in-progress" | "completed";
  createdAt: string;
  updatedAt: string;
}
