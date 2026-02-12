
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
    });

    // Attach io to global so API routes can access it (Hacky but works in simple Next setups)
    // A better way is Redis Pub/Sub if scaling, but for single server this is fine.
    // Actually, in App Router API routes, we can't easily access this 'io' instance.
    // We need a separate mechanism.

    // Standard pattern: Use a singleton or attach to global.
    (global as any).io = io;


    // Subscribe to Redis updates
    const Redis = require("ioredis");
    // Create a dedicated improved Redis client for subscription
    const sub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

    sub.psubscribe("team:*:updates", (err: any, count: any) => {
        if (err) {
            console.error("Failed to subscribe: %s", err.message);
        } else {
            console.log(`Subscribed to ${count} channels. Listening for updates on team:*:updates`);
        }
    });

    sub.on("pmessage", (pattern: string, channel: string, message: string) => {
        console.log(`Received ${message} from ${channel}`);
        // Extract teamId from channel "team:{teamId}:updates"
        const match = channel.match(/^team:(.+):updates$/);
        const teamId = match ? match[1] : null;


        if (teamId) {
            try {
                const data = JSON.parse(message);
                // Inject teamId so client knows context
                if (typeof data === 'object' && data !== null) {
                    data.teamId = teamId;
                }
                // Broadcast to the specific room
                io.to(`team:${teamId}`).emit("allocation-update", data);
            } catch (e) {
                console.error("Error parsing message", e);
            }
        }

    });

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        socket.on("join-team", (teamId) => {
            socket.join(`team:${teamId}`);
            console.log(`Socket ${socket.id} joined team:${teamId}`);
        });

        socket.on("disconnect", () => {
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
