import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useGuestMode } from "@/hooks/useGuestMode";

const GUEST_PERSONAL_TEAM_ID = 'guest-personal-team';

export function usePersonalWorkspace() {
    const { isGuest } = useGuestMode();

    return useQuery({
        queryKey: ["personalWorkspace"],
        queryFn: async () => {
            if (isGuest) return GUEST_PERSONAL_TEAM_ID;
            const { data } = await api.get("/user/personal");
            return data.id as string;
        },
        staleTime: Infinity,
        enabled: isGuest || undefined, // always enabled for guest; for real users react-query default (true)
    });
}
