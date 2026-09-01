import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Team } from "./useTeams";

export interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
    role?: string;
    skills?: string[];
    workload?: number;
    teams?: Team[];
    resumeUrl?: string;
    wallpaperUrl?: string;
    autoDeleteStaleTasks?: boolean;
    [key: string]: unknown;
}

// Fetch user by ID
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useUser = (id: string, options?: any) => {
    const fetchUser = async (): Promise<User> => {
        const { data } = await api.get(`/users/${id}`);
        return data;
    };

    return useQuery<User, Error>({
        queryKey: ["user", id],
        queryFn: fetchUser,
        enabled: !!id,
        ...options
    });
};

// Update user
export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
            const res = await api.put(`/users/${id}`, data);
            return res.data;
        },
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: ["user", id] });
            const previousUser = queryClient.getQueryData<User>(["user", id]);

            if (previousUser) {
                queryClient.setQueryData<User>(["user", id], (old) => {
                    if (!old) return previousUser; // Should not happen if previousUser exists
                    return { ...old, ...data };
                });
            }

            return { previousUser };
        },
        onError: (err, variables, context) => {
            if (context?.previousUser) {
                queryClient.setQueryData(["user", variables.id], context.previousUser);
            }
        },
        onSettled: (data, error, variables) => {
            queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
        }
    });
};
