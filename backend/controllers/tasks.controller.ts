import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { getCanonicalSkill, formatSkill } from "../lib/skills.js";

// -- Create Task --
export const createTask = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description, // 'desc' in schema
      difficulty,
      requiredSkill, // Schema has 'requiredSkill' (String)
      priority,
      assignedToId, // Schema has 'assignedToId'
      teamId,
      status = "pending",
    } = req.body;

    if (!teamId || !title || !requiredSkill) {
      return res.status(400).json({ error: "Missing required fields (title, teamId, requiredSkill)" });
    }

    const newTask = await prisma.task.create({
      data: {
        title,
        desc: description,
        difficulty: parseInt(difficulty) || 1,
        // Try to canonicalize, otherwise just format it nicely
        requiredSkill: getCanonicalSkill(requiredSkill) || formatSkill(requiredSkill),
        priority,
        status,
        teamId,
        assignedToId: assignedToId || null,
      }
    });

    res.status(201).json(newTask);
  } catch (err) {
    console.error("Error creating task:", err);
    res.status(500).json({ error: "Failed to create task" });
  }
};

// -- Get All Tasks --
export const getAllTasks = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Filter ONLY tasks assigned to the user
    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: userId
      },
      include: {
        team: true,
        assignedTo: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    res.json(tasks);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

// -- Get Task By ID --
export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        team: true,
        assignedTo: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) {
    console.error("Error fetching task:", err);
    res.status(500).json({ error: "Failed to fetch task" });
  }
};

// -- Update Task --
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      difficulty,
      requiredSkill,
      priority,
      status,
      assignedToId
    } = req.body;
    // @ts-ignore
    const userId = req.user?.id;

    const updatedTask = await prisma.$transaction(async (tx) => {
      // Check if task exists and get Team info
      const existingTask = await tx.task.findUnique({
        where: { id },
        include: { team: true }
      });

      if (!existingTask) throw new Error("Task not found");

      const isLeader = existingTask.team.leaderId === userId;
      const isAssignee = existingTask.assignedToId === userId;

      if (!isLeader && !isAssignee) {
        throw new Error("Not authorized to update this task");
      }

      // If not leader, ensure they are ONLY updating status
      if (!isLeader) {
        if (title || description || difficulty || requiredSkill || priority || assignedToId) {
          throw new Error("Only team leader can edit task details. You can only update status.");
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (title) updateData.title = title;
      if (description !== undefined) updateData.desc = description;
      if (difficulty) updateData.difficulty = parseInt(difficulty);
      if (requiredSkill) updateData.requiredSkill = getCanonicalSkill(requiredSkill) || formatSkill(requiredSkill);
      if (priority) updateData.priority = priority;
      if (status) updateData.status = status;
      if (assignedToId !== undefined) updateData.assignedToId = assignedToId;

      // Auto-change status to 'active' if assigned and currently 'pending'
      if (assignedToId) {
        const effectiveStatus = updateData.status || existingTask.status;
        if (effectiveStatus === 'pending') {
          updateData.status = 'active';
        }
      } else if (assignedToId === null) {
        // If unassigned, auto-switch to pending
        updateData.status = 'pending';
      }

      // Handle Workload Updates if assignment changed
      if (assignedToId !== undefined && assignedToId !== existingTask.assignedToId) {
        // 1. Decrement old assignee workload
        if (existingTask.assignedToId) {
          await tx.user.update({
            where: { id: existingTask.assignedToId },
            data: { workload: { decrement: 1 } }
          });
        }
        // 2. Increment new assignee workload
        if (assignedToId) {
          await tx.user.update({
            where: { id: assignedToId },
            data: { workload: { increment: 1 } }
          });
        }
      }

      return await tx.task.update({
        where: { id },
        data: updateData,
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true }
          }
        }
      });
    }, {
      timeout: 10000 // 10s timeout to prevent transaction errors
    });

    res.json(updatedTask);

  } catch (err: any) {
    console.error("Error updating task:", err);
    if (err.message === "Task not found") return res.status(404).json({ error: "Task not found" });
    if (err.message.includes("Not authorized") || err.message.includes("Only team leader")) return res.status(403).json({ error: err.message });
    res.status(500).json({ error: "Failed to update task" });
  }
};

// -- Delete Task --
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.user?.id;

    const result = await prisma.$transaction(async (tx) => {
      // Fetch task AND team to check leadership
      const existingTask = await tx.task.findUnique({
        where: { id },
        include: { team: true }
      });

      if (!existingTask) throw new Error("Task not found");

      // Only Leader can delete
      if (existingTask.team.leaderId !== userId) {
        throw new Error("Only team leader can delete tasks");
      }

      // Decrement workload if assigned
      if (existingTask.assignedToId) {
        await tx.user.update({
          where: { id: existingTask.assignedToId },
          data: { workload: { decrement: 1 } }
        });
      }

      await tx.task.delete({ where: { id } });

      return { message: "Task deleted successfully" };
    }, {
      timeout: 10000
    });

    res.json(result);
  } catch (err: any) {
    console.error("Error deleting task:", err);
    if (err.message === "Task not found") return res.status(404).json({ error: "Task not found" });
    if (err.message.includes("Only team leader")) return res.status(403).json({ error: err.message });
    res.status(500).json({ error: "Failed to delete task" });
  }
};
