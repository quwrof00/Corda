import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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
  team?: { id?: string; name?: string;[key: string]: unknown } | null;
  requiredSkill?: string | null;
  source?: string;
  recurrenceId?: string | null;
  [key: string]: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  nextPage: number | null;
}

export interface TaskListParams {
  teamId?: string;
  limit?: number;
  sortBy?: "deadline" | "priority" | "newest";
  status?: "All" | "Todo" | "In Progress" | "Blocked" | "Done";
  priority?: "all" | "High" | "Medium" | "Low";
  dateFilter?: "all" | "today" | "week" | "overdue" | "custom";
  startDate?: string;
  endDate?: string;
}

type TaskCacheData = Task[] | InfiniteData<PaginatedResponse<Task>> | undefined;

const DEFAULT_LIMIT = 20;

function buildTaskSearchParams(params?: TaskListParams, page?: number) {
  const searchParams = new URLSearchParams();

  if (page) searchParams.set("page", String(page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.priority) searchParams.set("priority", params.priority);
  if (params?.dateFilter) searchParams.set("dateFilter", params.dateFilter);
  if (params?.startDate) searchParams.set("startDate", params.startDate);
  if (params?.endDate) searchParams.set("endDate", params.endDate);
  if (params?.teamId) searchParams.set("teamId", params.teamId);

  return searchParams.toString();
}

export async function fetchTaskPage(
  params?: TaskListParams,
  page: number = 1
): Promise<PaginatedResponse<Task>> {
  const query = buildTaskSearchParams(
    { ...params, limit: params?.limit ?? DEFAULT_LIMIT },
    page
  );

  const basePath = params?.teamId ? `/teams/${params.teamId}/tasks` : "/tasks";
  const path = query ? `${basePath}?${query}` : basePath;
  const { data } = await api.get(path);
  return data;
}

async function fetchAllTaskPages(params?: TaskListParams): Promise<Task[]> {
  const items: Task[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetchTaskPage(
      { ...params, limit: params?.limit ?? 100 },
      page
    );
    items.push(...response.items);
    hasMore = response.hasMore;
    page = response.nextPage ?? page + 1;
  }

  return items;
}

function updateTaskCache(
  cache: TaskCacheData,
  updater: (task: Task) => Task | null
): TaskCacheData {
  if (!cache) return cache;

  if (Array.isArray(cache)) {
    return cache
      .map((task) => updater(task))
      .filter((task): task is Task => task !== null);
  }

  if ("pages" in cache) {
    return {
      ...cache,
      pages: cache.pages.map((page) => ({
        ...page,
        items: page.items
          .map((task) => updater(task))
          .filter((task): task is Task => task !== null),
      })),
    };
  }

  return cache;
}

function prependTaskCache(cache: TaskCacheData, task: Task): TaskCacheData {
  if (!cache) return cache;

  if (Array.isArray(cache)) {
    return [task, ...cache];
  }

  if ("pages" in cache && cache.pages.length > 0) {
    const [firstPage, ...restPages] = cache.pages;
    return {
      ...cache,
      pages: [
        {
          ...firstPage,
          items: [task, ...firstPage.items],
          total: firstPage.total + 1,
        },
        ...restPages.map((page) => ({ ...page, total: page.total + 1 })),
      ],
    };
  }

  return cache;
}

export function flattenInfiniteTasks(
  data?: InfiniteData<PaginatedResponse<Task>>
): Task[] {
  return data?.pages.flatMap((page) => page.items) ?? [];
}

export const useInfiniteTasks = (
  params?: TaskListParams,
  options?: { enabled?: boolean }
) => {
  return useInfiniteQuery({
    queryKey: ["tasks", "infinite", params],
    queryFn: ({ pageParam }) => fetchTaskPage(params, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    enabled: options?.enabled,
  });
};

export const useTasks = (
  teamId?: string,
  options?: { initialData?: Task[]; enabled?: boolean }
) => {
  return useQuery<Task[]>({
    queryKey: ["tasks", teamId, "all"],
    queryFn: () => fetchAllTaskPages({ teamId }),
    initialData: options?.initialData,
    enabled: options?.enabled,
  });
};

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

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const { data } = await api.post("/tasks", task);
      return data;
    },
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Generate a permanent client-side UUID so we don't have temp ID mismatches
      if (!newTask.id) newTask.id = crypto.randomUUID();
      const realId = newTask.id;

      const tempTask: Task = {
        ...newTask,
        id: realId,
        createdAt: new Date().toISOString(),
        status: newTask.status || "pending",
        priority: newTask.priority || "Medium",
        title: newTask.title || "",
        assignedTo: newTask.assignedToId
          ? { id: newTask.assignedToId, name: "Assigned..." }
          : null,
        children: [],
      } as Task;

      const snapshots = queryClient.getQueriesData<TaskCacheData>({
        queryKey: ["tasks"],
      });

      snapshots.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(queryKey, prependTaskCache(previousData, tempTask));
      });

      return { snapshots, realId };
    },
    onSuccess: (realTask, variables, context) => {
      if (!context) return;

      // 1. Seed the individual task cache so navigating to it is instantaneous
      queryClient.setQueryData(["task", realTask.id], realTask);

      // 2. Seamlessly swap if the server returns any updated fields
      const snapshots = queryClient.getQueriesData<TaskCacheData>({
        queryKey: ["tasks"],
      });

      snapshots.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(
          queryKey,
          updateTaskCache(previousData, (task) =>
            task.id === context.realId ? { ...task, ...realTask } : task
          )
        );
      });
    },
    onError: (err, newTask, context) => {
      context?.snapshots?.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(queryKey, previousData);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data } = await api.put(`/tasks/${id}`, updates);
      return data;
    },
    retry: (failureCount, error: any) => {
      // Retry up to 8 times for 404s to handle optimistic UI race conditions in slow dev environments
      if (error?.response?.status === 404 && failureCount < 8) return true;
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * (1.5 ** attemptIndex), 5000),
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      await queryClient.cancelQueries({ queryKey: ["task", id] });

      const previousTask = queryClient.getQueryData<Task>(["task", id]);
      const snapshots = queryClient.getQueriesData<TaskCacheData>({
        queryKey: ["tasks"],
      });

      // Prepare optimistic update object
      const optimisticUpdate = { ...updates };

      // If we are updating assignedToId, optimistically update the assignedTo object
      // so that UI components filtering/grouping by assignee (like TeamTaskBoard)
      // update their views immediately.
      if ("assignedToId" in updates) {
        if (updates.assignedToId === null) {
          optimisticUpdate.assignedTo = null;
        } else {
          // If we have previousTask, we might keep its name if IDs match (unlikely for reassign)
          // Otherwise, we just set the ID so filters/grouping logic (which uses task.assignedTo.id) works.
          const targetName = previousTask?.assignedTo?.id === updates.assignedToId
            ? previousTask?.assignedTo?.name
            : "Assigning...";

          optimisticUpdate.assignedTo = {
            id: updates.assignedToId as string,
            name: targetName ?? "Assigning..."
          };
        }
      }

      // Update single task cache
      queryClient.setQueryData(["task", id], (old: Task | undefined) =>
        old ? { ...old, ...optimisticUpdate } : old
      );

      // Update all task lists caches
      snapshots.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(
          queryKey,
          updateTaskCache(previousData, (task) =>
            task.id === id ? { ...task, ...optimisticUpdate } : task
          )
        );
      });

      return { previousTask, snapshots };
    },
    onError: (err, variables, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(["task", variables.id], context.previousTask);
      }

      context?.snapshots?.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(queryKey, previousData);
      });
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: string | { id: string; deleteRecurring?: boolean }) => {
      const id = typeof payload === "string" ? payload : payload.id;
      const deleteRecurring = typeof payload === "string" ? false : !!payload.deleteRecurring;

      const url = deleteRecurring ? `/tasks/${id}?deleteRecurring=true` : `/tasks/${id}`;
      const { data } = await api.delete(url);
      return data;
    },
    retry: (failureCount, error: any) => {
      // Retry up to 8 times for 404s to handle optimistic UI race conditions in slow dev environments
      if (error?.response?.status === 404 && failureCount < 8) return true;
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * (1.5 ** attemptIndex), 5000),
    onMutate: async (payload) => {
      const id = typeof payload === "string" ? payload : payload.id;
      const deleteRecurring = typeof payload === "string" ? false : !!payload.deleteRecurring;

      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      await queryClient.cancelQueries({ queryKey: ["task", id] });

      const snapshots = queryClient.getQueriesData<TaskCacheData>({
        queryKey: ["tasks"],
      });

      snapshots.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(
          queryKey,
          updateTaskCache(previousData, (task) => {
            if (task.id === id) return null;
            if (deleteRecurring && task.recurrenceId) return null;
            return task;
          })
        );
      });

      return { id, snapshots };
    },
    onError: (err, payload, context) => {
      context?.snapshots?.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(queryKey, previousData);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};
