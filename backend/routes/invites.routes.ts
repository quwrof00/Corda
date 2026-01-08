import { Router } from "express";
import { acceptInvite } from "../controllers/invites.controller.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticateToken);

router.post("/accept", acceptInvite);

export default router;
