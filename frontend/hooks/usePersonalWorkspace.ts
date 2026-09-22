import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const GUEST_PERSONAL_TEAM_ID = 'guest-personal-team';

export function usePersonalWorkspace() {
    const isGuest = typeof window !== 'undefined' && localStorage.getItem('guestMode') === 'true';

    return useQuery({
        queryKey: ["personalWorkspace"],
        queryFn: async () => {
            if (isGuest) return GUEST_PERSONAL_TEAM_ID;
            const { data } = await api.get("/user/personal");
            return data.id as string;
        },
        staleTime: Infinity,
        enabled: isGuest ? true : undefined,
    });
}
