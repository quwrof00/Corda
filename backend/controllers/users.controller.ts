import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { formatSkill } from "../lib/skills.js";

// -- Create User --
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, skills, role } = req.body;

    // Basic validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields: name, email, password" });
    }

    if (typeof password !== 'string') {
      return res.status(400).json({ error: "Password must be a string" });
    }

    // 1. Check for duplicate Email
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    // 2. Password Security Conditions
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: "Password must contain at least one uppercase letter" });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ error: "Password must contain at least one lowercase letter" });
    }
    if (!/\d/.test(password)) {
      return res.status(400).json({ error: "Password must contain at least one number" });
    }
    // Special character check
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({ error: "Password must contain at least one special character" });
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password, // In production, hash this!
        skills: Array.isArray(skills) ? skills.map(formatSkill).filter(Boolean) : [],
        role,
        workload: 0
      }
    });

    res.status(201).json(newUser);
  } catch (err: any) {
    console.error("Error creating user:", err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: "Email is already registered" });
    }
    res.status(500).json({ error: "Failed to create user" });
  }
};

// -- Get All Users --
export const getAllUsers = async (_: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        skills: true,
        workload: true,
        role: true,
        // Exclude password
      }
    });
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// -- Get User By ID --
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        skills: true,
        workload: true,
        role: true,
        resumeUrl: true,
        teams: {
          select: { id: true, name: true }
        }
      }
    });

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// -- Get User Tasks --
export const getUserTasks = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: id,
        // Only show tasks if the user is STILL in the team or is the leader
        team: {
          OR: [
            { members: { some: { id } } },
            { leaderId: id }
          ]
        }
      }
    });
    res.json(tasks);
  } catch (err) {
    console.error("Error fetching user tasks:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// -- Update User --
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`[updateUser] Request for ID: ${id} `);

    // Secure Update: Ensure user can only update themselves
    // @ts-ignore
    if (req.user?.id !== id) {
      return res.status(403).json({ error: "Unauthorized: You can only update your own profile" });
    }

    const { name, skills, resumeUrl } = req.body;

    // Construct data object to only include defined fields
    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (skills !== undefined) {
      dataToUpdate.skills = Array.isArray(skills)
        ? skills.map(formatSkill).filter(Boolean)
        : [];
    }
    if (resumeUrl !== undefined) dataToUpdate.resumeUrl = resumeUrl;
    // Note: Teams are now managed via invite/add-member flows, not direct user update

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate
    });

    console.log(`[updateUser] Successfully updated user ${id} `);
    res.json(updatedUser);
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// -- Get User Teams --
export const getUserTeams = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Relation way: Find teams where (members some id = userId)
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: { id }
        }
      }
    });

    res.json(teams);
  } catch (err) {
    console.error("Error fetching user teams:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
