import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  [key: string]: unknown;
}

// Fetch all teams
export const useTeams = (options?: any) => {
  const fetchTeams = async (): Promise<Team[]> => {
    const { data } = await api.get("/teams");
    return data;
  };
  return useQuery<Team[], Error>({ queryKey: ["teams"], queryFn: fetchTeams, initialData: options?.initialData, ...options });
};

// Fetch a single team by ID
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

// Fetch all members of a team
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

// Fetch all tasks of a team
export const useTeamTasks = (id: string) => {
  return useQuery({
    queryKey: ["teamTasks", id],
    queryFn: async () => {
      const { data } = await api.get(`/teams/${id}/tasks`);
      return data;
    },
    enabled: !!id,
  });
};

// Create a new team
export const useCreateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (team: Partial<Team>) => {
      const { data } = await api.post("/teams", team);
      return data;
    },
    onMutate: async (newTeam) => {
      await queryClient.cancelQueries({ queryKey: ["teams"] });
      const previousTeams = queryClient.getQueryData(["teams"]);
      queryClient.setQueryData(["teams"], (old: Team[]) => {
        return [...(old || []), { ...newTeam, id: "temp-id-" + Date.now(), members: [] }];
      });
      return { previousTeams };
    },
    onError: (err, newTeam, context) => {
      if (context?.previousTeams) {
        queryClient.setQueryData(["teams"], context.previousTeams);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
};

// Update an existing team
export const useUpdateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string;[key: string]: unknown }) => {
      const { data } = await api.put(`/teams/${id}`, updates);
      return data;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ["team", id] });
      await queryClient.cancelQueries({ queryKey: ["teams"] });

      const previousTeam = queryClient.getQueryData(["team", id]);
      const previousTeams = queryClient.getQueryData(["teams"]);

      // Update individual team
      queryClient.setQueryData(["team", id], (old: Team) => ({ ...old, ...updates }));

      // Update in list
      queryClient.setQueryData(["teams"], (old: Team[]) =>
        old?.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );

      return { previousTeam, previousTeams };
    },
    onError: (err, variables, context) => {
      if (context) {
        if (context.previousTeam) queryClient.setQueryData(["team", variables.id], context.previousTeam);
        if (context.previousTeams) queryClient.setQueryData(["teams"], context.previousTeams);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
};

// Delete a team
export const useDeleteTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/teams/${id}`);
      return data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["teams"] });
      const previousTeams = queryClient.getQueryData(["teams"]);

      queryClient.setQueryData(["teams"], (old: Team[]) => old?.filter((t) => t.id !== id));

      return { previousTeams };
    },
    onError: (err, id, context) => {
      if (context?.previousTeams) queryClient.setQueryData(["teams"], context.previousTeams);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
};

// Invite a member to a team
export const useInviteMember = () => {
  return useMutation({
    mutationFn: async ({ teamId, email }: { teamId: string; email: string }) => {
      const { data } = await api.post(`/teams/${teamId}/invite`, { email });
      return data;
    },
  });
};

// Remove a member from a team
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
        old?.filter((m) => m.id !== userId)
      );

      return { previousMembers };
    },
    onError: (err, variables, context) => {
      if (context?.previousMembers) queryClient.setQueryData(["teamMembers", variables.teamId], context.previousMembers);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers", variables.teamId] });
      // Also potentially invalidate tasks as they might get unassigned?
      queryClient.invalidateQueries({ queryKey: ["tasks", variables.teamId] });
    },
  });
};
