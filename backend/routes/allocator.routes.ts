import { Router } from "express";
import { allocateTasksForTeam } from "../controllers/allocator.controller.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticateToken);

router.post("/:teamId/allocate", allocateTasksForTeam);

export default router;
