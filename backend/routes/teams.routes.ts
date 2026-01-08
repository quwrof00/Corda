import { Router } from "express";
import {
  createTeam,
  getAllTeams,
  getTeamById,
  getTeamMembers,
  getTeamTasks,
  inviteMember,
  updateTeam,
  deleteTeam,
  removeMember,
} from "../controllers/teams.controller.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticateToken);

router.post("/", createTeam);
router.get("/", getAllTeams);
router.get("/:id", getTeamById);
router.put("/:id", updateTeam);
router.delete("/:id", deleteTeam);

router.get("/:id/members", getTeamMembers);
router.delete("/:id/members/:userId", removeMember);

router.get("/:id/tasks", getTeamTasks);
router.post("/:id/invite", inviteMember);

export default router;
