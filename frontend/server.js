"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var http_1 = require("http");
var url_1 = require("url");
var next_1 = __importDefault(require("next"));
var socket_io_1 = require("socket.io");
var dev = process.env.NODE_ENV !== "production";
var hostname = "0.0.0.0";
var port = parseInt(process.env.PORT || "3000", 10);
// when using middleware `hostname` and `port` must be provided below
var app = (0, next_1.default)({ dev: dev, hostname: hostname, port: port });
var handle = app.getRequestHandler();
app.prepare().then(function () {
    var httpServer = (0, http_1.createServer)(function (req, res) {
        var parsedUrl = (0, url_1.parse)(req.url, true);
        handle(req, res, parsedUrl);
    });
    var io = new socket_io_1.Server(httpServer, {
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
    global.io = io;
    // Subscribe to Redis updates
    var Redis = require("ioredis");
    // Create a dedicated improved Redis client for subscription
    var sub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    // Subscribe to all team events
    sub.psubscribe("team:*", function (err, count) {
        if (err) {
            console.error("Failed to subscribe: %s", err.message);
        }
        else {
            console.log("Subscribed to ".concat(count, " channels. Listening for updates on team:*"));
        }
    });
    sub.on("pmessage", function (pattern, channel, message) {
        // console.log(`Received ${message} from ${channel}`);
        // Channel format: team:{teamId}
        var match = channel.match(/^team:(.+)$/);
        var teamId = match ? match[1] : null;
        if (teamId) {
            try {
                var parsed = JSON.parse(message);
                // Broadcast to the specific team room
                io.to("team:".concat(teamId)).emit("team-event", parsed);
            }
            catch (e) {
                console.error("Error parsing message", e);
            }
        }
    });
    io.on("connection", function (socket) {
        console.log("Client connected:", socket.id);
        socket.on("join-team", function (data) {
            if (typeof data === 'string') {
                var teamId = data;
                socket.join("team:".concat(teamId));
                console.log("Socket ".concat(socket.id, " joined team:").concat(teamId));
            }
            else {
                var teamId = data.teamId, userId = data.userId;
                socket.join("team:".concat(teamId));
                // Store metadata for presence
                if (!socket.data)
                    socket.data = { userId: userId, teamIds: new Set() };
                socket.data.teamIds.add(teamId);
                console.log("User ".concat(userId, " joined team:").concat(teamId));
                io.to("team:".concat(teamId)).emit("USER_ONLINE", userId);
            }
        });
        socket.on("disconnect", function () {
            var data = socket.data;
            if ((data === null || data === void 0 ? void 0 : data.teamIds) && (data === null || data === void 0 ? void 0 : data.userId)) {
                data.teamIds.forEach(function (teamId) {
                    io.to("team:".concat(teamId)).emit("USER_OFFLINE", data.userId);
                });
            }
            console.log("Client disconnected:", socket.id);
        });
    });
    httpServer
        .once("error", function (err) {
        console.error(err);
        process.exit(1);
    })
        .listen(port, function () {
        console.log("> Ready on http://".concat(hostname, ":").concat(port));
    });
});
