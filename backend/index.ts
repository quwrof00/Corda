import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// FIX: Added .js extensions to all local, relative imports (MANDATORY for Node.js ES Modules)
import userRoutes from "./routes/users.routes.js";
import teamRoutes from "./routes/teams.routes.js";
import taskRoutes from "./routes/tasks.routes.js";
import authRoutes from "./lib/auth.js";
import allocatorRoutes from "./routes/allocator.routes.js";
import inviteRoutes from "./routes/invites.routes.js";

dotenv.config();

const app = express();
// Enable CORS for all requests
app.use(
  cors({
    origin: process.env.FRONTEND_URL!,
    credentials: true,
  })
);
// Enable express to parse JSON body content
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/allocator", allocatorRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/invites", inviteRoutes);

// Default route
app.get(["/", "/api"], (_, res) => {
  res.json({ message: "Smart Task Allocator API is running" });
});

// Start server
const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;