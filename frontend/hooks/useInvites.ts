import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Team } from "./useTeams";

export interface Invite {
    id: string;
    teamId: string;
    email: string;
    role: string;
    tokenHash: string;
    expiresAt: string;
    acceptedAt: string | null;
    createdAt: string;
    team: Team;
}

export interface InvitesResponse {
    received: Invite[];
    sent: Invite[];
}

export const useInvites = (options?: { enabled?: boolean }) => {
    return useQuery<InvitesResponse, Error>({
        queryKey: ["invites"],
        queryFn: async () => {
            const { data } = await api.get("/invites");
            return data;
        },
        enabled: options?.enabled ?? true,
    });
};

export const useAcceptInvite = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.post(`/invites/${id}/accept`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invites"] });
            queryClient.invalidateQueries({ queryKey: ["teams"] });
        },
    });
};

export const useDeleteInvite = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.delete(`/invites/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invites"] });
        },
    });
};
