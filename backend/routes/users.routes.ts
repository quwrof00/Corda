import { Router } from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  getUserTasks,
  getUserTeams,
  updateUser,
} from "../controllers/users.controller.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

// Public route: Registration
router.post("/", createUser);

router.use(authenticateToken); // Protect all user routes below

// router.post("/", createUser); // Moved above
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.get("/:id/tasks", getUserTasks);
router.get("/:id/teams", getUserTeams);

export default router;
