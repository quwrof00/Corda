import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function usePersonalWorkspace() {
    return useQuery({
        queryKey: ["personalWorkspace"],
        queryFn: async () => {
            const { data } = await api.get("/user/personal");
            return data.id as string;
        },
        staleTime: Infinity,
    });
}
