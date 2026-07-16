import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Member {
  id: string;
  name: string;
  email?: string;
  role?: string;
  image?: string;
}

export interface Team {
  id: string;
  name: string;
  desc?: string;
  members?: Member[];
  leader?: Member;
  leaderId?: string;
  createdAt?: string;
  updatedAt?: string;
  tasks?: { id: string }[];
  _count?: { tasks: number };
  enableAll?: boolean;
  [key: string]: unknown;
}

export interface PaginatedTeamResponse {
  items: Team[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  nextPage: number | null;
}

type TeamCacheData = Team[] | InfiniteData<PaginatedTeamResponse> | undefined;

const DEFAULT_LIMIT = 12;

async function fetchTeamsPage(page: number = 1, limit: number = DEFAULT_LIMIT) {
  const { data } = await api.get(`/teams?page=${page}&limit=${limit}`);
  return data as PaginatedTeamResponse;
}

async function fetchAllTeams(): Promise<Team[]> {
  const teams: Team[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetchTeamsPage(page, 100);
    teams.push(...response.items);
    hasMore = response.hasMore;
    page = response.nextPage ?? page + 1;
  }

  return teams;
}

function updateTeamCache(
  cache: TeamCacheData,
  updater: (team: Team) => Team | null
): TeamCacheData {
  if (!cache) return cache;

  if (Array.isArray(cache)) {
    return cache
      .map((team) => updater(team))
      .filter((team): team is Team => team !== null);
  }

  if ("pages" in cache) {
    return {
      ...cache,
      pages: cache.pages.map((page) => ({
        ...page,
        items: page.items
          .map((team) => updater(team))
          .filter((team): team is Team => team !== null),
      })),
    };
  }

  return cache;
}

function prependTeamCache(cache: TeamCacheData, team: Team): TeamCacheData {
  if (!cache) return cache;

  if (Array.isArray(cache)) {
    return [team, ...cache];
  }

  if ("pages" in cache && cache.pages.length > 0) {
    const [firstPage, ...restPages] = cache.pages;
    return {
      ...cache,
      pages: [
        {
          ...firstPage,
          items: [team, ...firstPage.items],
          total: firstPage.total + 1,
        },
        ...restPages.map((page) => ({ ...page, total: page.total + 1 })),
      ],
    };
  }

  return cache;
}

export function flattenInfiniteTeams(
  data?: InfiniteData<PaginatedTeamResponse>
): Team[] {
  return data?.pages.flatMap((page) => page.items) ?? [];
}

export const useInfiniteTeams = (
  options?: { enabled?: boolean; limit?: number }
) => {
  return useInfiniteQuery({
    queryKey: ["teams", "infinite", options?.limit ?? DEFAULT_LIMIT],
    queryFn: ({ pageParam }) => fetchTeamsPage(pageParam, options?.limit ?? DEFAULT_LIMIT),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    enabled: options?.enabled,
  });
};

export const useTeams = (options?: { initialData?: Team[] }) => {
  return useQuery<Team[], Error>({
    queryKey: ["teams", "all"],
    queryFn: fetchAllTeams,
    initialData: options?.initialData,
  });
};

export const useTeam = (id: string) => {
  return useQuery({
    queryKey: ["team", id],
    queryFn: async () => {
      const { data } = await api.get(`/teams/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useTeamMembers = (id: string) => {
  return useQuery({
    queryKey: ["teamMembers", id],
    queryFn: async () => {
      const { data } = await api.get(`/teams/${id}/members`);
      return data;
    },
    enabled: !!id,
  });
};

export const useTeamTasks = (id: string) => {
  return useQuery({
    queryKey: ["teamTasks", id],
    queryFn: async () => {
      const items: unknown[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const { data } = await api.get(`/teams/${id}/tasks?page=${page}&limit=100`);
        items.push(...data.items);
        hasMore = data.hasMore;
        page = data.nextPage ?? page + 1;
      }

      return items;
    },
    enabled: !!id,
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (team: Partial<Team>) => {
      const { data } = await api.post("/teams", team);
      return data;
    },
    onMutate: async (newTeam) => {
      await queryClient.cancelQueries({ queryKey: ["teams"] });
      const snapshots = queryClient.getQueriesData<TeamCacheData>({
        queryKey: ["teams"],
      });

      const tempId = `temp-id-${Date.now()}`;
      const optimisticTeam = {
        ...newTeam,
        id: tempId,
        members: [],
      } as Team;

      snapshots.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(queryKey, prependTeamCache(previousData, optimisticTeam));
      });

      return { snapshots, tempId };
    },
    onSuccess: (realTeam, variables, context) => {
      if (!context) return;
      
      // Seed the individual team cache
      queryClient.setQueryData(["team", realTeam.id], realTeam);

      // Seamlessly swap the fake temp ID with the real ID locally
      const snapshots = queryClient.getQueriesData<TeamCacheData>({
        queryKey: ["teams"],
      });

      snapshots.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(
          queryKey,
          updateTeamCache(previousData, (team) =>
            team.id === context.tempId ? { ...team, ...realTeam } : team
          )
        );
      });
    },
    onError: (err, newTeam, context) => {
      context?.snapshots?.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(queryKey, previousData);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
};

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data } = await api.put(`/teams/${id}`, updates);
      return data;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ["team", id] });
      await queryClient.cancelQueries({ queryKey: ["teams"] });

      const previousTeam = queryClient.getQueryData(["team", id]);
      const snapshots = queryClient.getQueriesData<TeamCacheData>({
        queryKey: ["teams"],
      });

      queryClient.setQueryData(["team", id], (old: Team) => ({ ...old, ...updates }));

      snapshots.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(
          queryKey,
          updateTeamCache(previousData, (team) =>
            team.id === id ? { ...team, ...updates } : team
          )
        );
      });

      return { previousTeam, snapshots };
    },
    onError: (err, variables, context) => {
      if (context?.previousTeam) {
        queryClient.setQueryData(["team", variables.id], context.previousTeam);
      }

      context?.snapshots?.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(queryKey, previousData);
      });
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/teams/${id}`);
      return data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["teams"] });
      const snapshots = queryClient.getQueriesData<TeamCacheData>({
        queryKey: ["teams"],
      });

      snapshots.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(
          queryKey,
          updateTeamCache(previousData, (team) => (team.id === id ? null : team))
        );
      });

      return { snapshots };
    },
    onError: (err, id, context) => {
      context?.snapshots?.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(queryKey, previousData);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
};

export const useInviteMember = () => {
  return useMutation({
    mutationFn: async ({ teamId, email }: { teamId: string; email: string }) => {
      const { data } = await api.post(`/teams/${teamId}/invite`, { email });
      return data;
    },
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      const { data } = await api.delete(`/teams/${teamId}/members/${userId}`);
      return data;
    },
    onMutate: async ({ teamId, userId }) => {
      await queryClient.cancelQueries({ queryKey: ["teamMembers", teamId] });
      const previousMembers = queryClient.getQueryData(["teamMembers", teamId]);

      queryClient.setQueryData(["teamMembers", teamId], (old: Member[]) =>
        old?.filter((member) => member.id !== userId)
      );

      return { previousMembers };
    },
    onError: (err, variables, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(["teamMembers", variables.teamId], context.previousMembers);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers", variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", variables.teamId] });
    },
  });
};
