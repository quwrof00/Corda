import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  teamId?: string;
  assignedToId?: string;
  desc?: string;
  description?: string;
  deadline?: string;
  createdAt?: string;
  parentId?: string | null;
  children?: Task[];
  assignedTo?: { id: string; name: string } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  team?: { id?: string; name?: string;[key: string]: any } | null;
  requiredSkill?: string | null;
  source?: string;
  [key: string]: unknown;
}

// Fetch all tasks or a single task list for a team if provided
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useTasks = (teamId?: string, options?: any) => {
  const fetchTasks = async () => {
    const { data } = await api.get(teamId ? `/teams/${teamId}/tasks` : "/tasks");
    return data;
  };

  return useQuery<Task[]>({
    queryKey: ["tasks", teamId],
    queryFn: fetchTasks,
    initialData: options?.initialData,
    ...options
  });
};

// Fetch a specific task by ID
export const useTask = (id: string) => {
  return useQuery({
    queryKey: ["task", id],
    queryFn: async () => {
      const { data } = await api.get(`/tasks/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

// Create a new task
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const { data } = await api.post("/tasks", task);
      return data;
    },
    onMutate: async (newTask) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot previous values for both team-specific and global lists
      const teamQueryKey = ["tasks", newTask.teamId];
      const globalQueryKey = ["tasks", undefined];

      const previousTeamTasks = queryClient.getQueryData(teamQueryKey);
      const previousGlobalTasks = queryClient.getQueryData(globalQueryKey);

      // Create optimistic task
      const tempTask: Task = {
        ...newTask,
        id: "temp-task-" + Date.now(),
        createdAt: new Date().toISOString(),
        status: newTask.status || "pending",
        priority: newTask.priority || "Medium",
        title: newTask.title || "",
        assignedTo: newTask.assignedToId ? { id: newTask.assignedToId, name: "Assigned..." } : null,
        children: [],
      } as Task;

      // Update team-specific list if teamId exists
      if (newTask.teamId) {
        queryClient.setQueryData(teamQueryKey, (old: Task[] | undefined) => {
          return [...(old || []), tempTask];
        });
      }

      // Always update global list for dashboard and other views
      queryClient.setQueryData(globalQueryKey, (old: Task[] | undefined) => {
        return [...(old || []), tempTask];
      });

      return { previousTeamTasks, previousGlobalTasks, teamQueryKey, globalQueryKey };
    },
    onError: (err, newTask, context) => {
      // Rollback on error
      if (context?.teamQueryKey && context.previousTeamTasks !== undefined) {
        queryClient.setQueryData(context.teamQueryKey, context.previousTeamTasks);
      }
      if (context?.globalQueryKey && context.previousGlobalTasks !== undefined) {
        queryClient.setQueryData(context.globalQueryKey, context.previousGlobalTasks);
      }
    },
    onSettled: () => {
      // Invalidate all task queries to get fresh data from server
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

// Update an existing task
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string;[key: string]: unknown }) => {
      const { data } = await api.put(`/tasks/${id}`, updates);
      return data;
    },
    onMutate: async ({ id, ...updates }) => {
      // 1. Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      await queryClient.cancelQueries({ queryKey: ["task", id] });

      // 2. Snapshot the previous value
      const previousTask = queryClient.getQueryData(["task", id]);

      // Optimistically update the detail view
      queryClient.setQueryData(["task", id], (old: Task) => (old ? { ...old, ...updates } : old));

      // Optimistically update ANY list containing this task
      queryClient.setQueriesData({ queryKey: ["tasks"] }, (old: Task[]) => {
        if (!Array.isArray(old)) return old;
        return old.map((task) => (task.id === id ? { ...task, ...updates } : task)); // Shallow merge
      });

      // Pass context
      return { previousTask };
    },
    onError: (err, variables, context) => {
      // Rollback detail
      if (context?.previousTask) {
        queryClient.setQueryData(["task", variables.id], context.previousTask);
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

// Delete a task
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/tasks/${id}`);
      return data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      await queryClient.cancelQueries({ queryKey: ["task", id] });

      // Optimistically remove from all lists
      queryClient.setQueriesData({ queryKey: ["tasks"] }, (old: Task[]) => {
        if (!Array.isArray(old)) return old;
        return old.filter((t) => t.id !== id);
      });

      return { id };
    },
    onError: () => {
      // Invalidate to restore
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

