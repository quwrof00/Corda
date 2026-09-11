"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTeams } from "@/hooks/useTeams";

type SocketContextType = {
    socket: Socket | null;
    isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({
    children
}: {
    children: ReactNode
}) => {
    const { data: session } = useSession();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const queryClient = useQueryClient();
    const { data: teams } = useTeams();

    useEffect(() => {
        if (!session?.user) {
            return;
        }

        const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "", {
            // path: "/api/socket/io", // Default path
            addTrailingSlash: false,
        });

        socketInstance.on("connect", () => {
            setIsConnected(true);
            console.log("Socket connected:", socketInstance.id);
        });

        socketInstance.on("disconnect", () => {
            setIsConnected(false);
            console.log("Socket disconnected");
        });

        // --- GLOBAL EVENT LISTENER ---
        socketInstance.on("team-event", (event: { type: string; meta?: { triggeredBy?: string; timestamp?: number } }) => {
            console.log("Global Team Event:", event);

            const { type, meta } = event;
            const triggeredBy = meta?.triggeredBy;

            // Optimistic UI updates
            // 1. Invalidate queries based on event type
            if (type.startsWith("TASK_") || type.includes("ALLOCATION")) {
                queryClient.invalidateQueries({ queryKey: ["tasks"] });
            }
            if (type.startsWith("MEMBER_")) {
                queryClient.invalidateQueries({ queryKey: ["teams"] });
            }

            // 2. Show toast notification if action wasn't by current user
            if (triggeredBy !== session.user.id) {
                const action = type.replace("TASK_", "").replace("STATUS_", "").replace("_", " ").toLowerCase();
                // Capitalize first letter
                const formattedAction = action.charAt(0).toUpperCase() + action.slice(1);

                if (type === "ALLOCATION_UPDATE") {
                    toast.success("Tasks auto-allocated!");
                } else {
                    toast.info(`Team Update: Task ${formattedAction}`);
                }
            }
        });

        socketInstance.on("USER_ONLINE", (userId: string) => {
            // Handle presence
            console.log("User online:", userId);
        });

        socketInstance.on("USER_OFFLINE", (userId: string) => {
            // Handle presence
            console.log("User offline:", userId);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [session, queryClient]);

    // Join teams when they are loaded or socket changes
    useEffect(() => {
        if (socket && isConnected && teams && session?.user) {
            teams.forEach((team) => {
                socket.emit("join-team", {
                    teamId: team.id,
                    userId: session.user.id
                });
            });
        }
    }, [socket, isConnected, teams, session]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
