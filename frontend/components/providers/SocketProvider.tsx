"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
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

    // Keep a ref to teams/session so the "connect" handler always sees latest values
    const teamsRef = useRef(teams);
    const sessionRef = useRef(session);
    useEffect(() => { teamsRef.current = teams; }, [teams]);
    useEffect(() => { sessionRef.current = session; }, [session]);

    useEffect(() => {
        if (!session?.user) {
            return;
        }

        const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "", {
            // path: "/api/socket/io", // Default path
            addTrailingSlash: false,
        });

        const joinAllTeams = () => {
            const currentTeams = teamsRef.current;
            const currentSession = sessionRef.current;
            if (currentTeams && currentSession?.user) {
                currentTeams.forEach((team) => {
                    socketInstance.emit("join-team", {
                        teamId: team.id,
                        userId: currentSession.user.id,
                    });
                });
            }
        };

        socketInstance.on("connect", () => {
            setIsConnected(true);
            console.log("Socket connected:", socketInstance.id);
            // Re-join all team rooms on every connect/reconnect so server restarts
            // (e.g. Render deployments) don't silently drop us from rooms
            joinAllTeams();
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

            // Invalidate relevant caches based on event type
            if (type.startsWith("TASK_") || type.includes("ALLOCATION")) {
                queryClient.invalidateQueries({ queryKey: ["tasks"] });
            }
            if (type.startsWith("MEMBER_") || type.startsWith("TEAM_")) {
                queryClient.invalidateQueries({ queryKey: ["teams"] });
                queryClient.invalidateQueries({ queryKey: ["team"] });
            }

            // Show toast notification if action wasn't by current user
            if (triggeredBy !== session.user.id) {
                const action = type.replace("TASK_", "").replace("STATUS_", "").replace("_", " ").toLowerCase();
                const formattedAction = action.charAt(0).toUpperCase() + action.slice(1);

                if (type === "ALLOCATION_UPDATE") {
                    toast.success("Tasks auto-allocated!");
                } else if (type.startsWith("TASK_")) {
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

    // Also join teams whenever teams list loads/changes while already connected
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
