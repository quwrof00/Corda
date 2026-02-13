
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    const io = new Server(httpServer, {
        // path: "/api/socket/io", // Optional: separate path
        addTrailingSlash: false,
        cors: {
            origin: process.env.NEXTAUTH_URL || "*",
            methods: ["GET", "POST"],
        }
    });

    // Attach io to global so API routes can access it (Hacky but works in simple Next setups)
    // A better way is Redis Pub/Sub if scaling, but for single server this is fine.
    // Actually, in App Router API routes, we can't easily access this 'io' instance.
    // We need a separate mechanism (Redis).
    (global as any).io = io;


    // Subscribe to Redis updates
    const Redis = require("ioredis");
    // Create a dedicated improved Redis client for subscription
    const sub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

    // Subscribe to all team events
    sub.psubscribe("team:*", (err: any, count: any) => {
        if (err) {
            console.error("Failed to subscribe: %s", err.message);
        } else {
            console.log(`Subscribed to ${count} channels. Listening for updates on team:*`);
        }
    });

    sub.on("pmessage", (pattern: string, channel: string, message: string) => {
        // console.log(`Received ${message} from ${channel}`);

        // Channel format: team:{teamId}
        const match = channel.match(/^team:(.+)$/);
        const teamId = match ? match[1] : null;

        if (teamId) {
            try {
                const parsed = JSON.parse(message);
                // Broadcast to the specific team room
                io.to(`team:${teamId}`).emit("team-event", parsed);
            } catch (e) {
                console.error("Error parsing message", e);
            }
        }
    });

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        socket.on("join-team", (data) => {
            if (typeof data === 'string') {
                const teamId = data;
                socket.join(`team:${teamId}`);
                console.log(`Socket ${socket.id} joined team:${teamId}`);
            } else {
                const { teamId, userId } = data;
                socket.join(`team:${teamId}`);

                // Store metadata for presence
                if (!(socket as any).data) (socket as any).data = { userId, teamIds: new Set() };
                (socket as any).data.teamIds.add(teamId);

                console.log(`User ${userId} joined team:${teamId}`);
                io.to(`team:${teamId}`).emit("USER_ONLINE", userId);
            }
        });

        socket.on("disconnect", () => {
            const data = (socket as any).data;
            if (data?.teamIds && data?.userId) {
                data.teamIds.forEach((teamId: string) => {
                    io.to(`team:${teamId}`).emit("USER_OFFLINE", data.userId);
                });
            }
            console.log("Client disconnected:", socket.id);
        });
    });


    httpServer
        .once("error", (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
});
