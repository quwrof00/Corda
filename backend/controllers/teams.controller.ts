import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

// -- Create Team --
export const createTeam = async (req: Request, res: Response) => {
  try {
    const { name, description, members = [], leaderId } = req.body;
    const requesterId = leaderId;

    // 1. Basic validation
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Missing or invalid field: name" });
    }

    if (!Array.isArray(members)) {
      return res.status(400).json({ error: "members must be an array" });
    }

    // 3. Normalize + dedupe members
    const memberSet = new Set<string>(members.map(String));
    memberSet.add(requesterId); // creator must be a member

    const finalMembers = Array.from(memberSet);

    // 4. Validate all members exist
    const existingUsers = await prisma.user.findMany({
      where: { id: { in: finalMembers } },
      select: { id: true }
    });

    if (existingUsers.length !== finalMembers.length) {
      return res.status(400).json({
        error: "One or more members do not exist"
      });
    }

    // 5. Transaction-safe creation
    const team = await prisma.$transaction(async (tx) => {
      return tx.team.create({
        data: {
          name,
          desc: description || null,
          leaderId: requesterId,
          members: {
            connect: finalMembers.map((id) => ({ id }))
          }
        },
        select: {
          id: true,
          name: true,
          leaderId: true,
        }
      });
    }, {
      timeout: 10000, // 10s timeout
    });

    return res.status(201).json(team);
  } catch (err: any) {
    console.error("Error creating team:", err);
    // Handle Prisma specific errors
    if (err.code === 'P2002') {
      return res.status(409).json({ error: "Unique constraint failed" });
    }
    return res.status(500).json({ error: "Failed to create team" });
  }
};

// -- Get All Teams --
export const getAllTeams = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: { id: userId }
        }
      },
      select: {
        id: true,
        name: true,
        desc: true,
        leader: {
          select: { id: true, name: true, email: true }
        },
        members: {
          select: { id: true }
        }
      }
    });

    return res.json(teams);
  } catch (err) {
    console.error("Error getting all teams:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// -- Get Team By ID --
export const getTeamById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        leader: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!team) return res.status(404).json({ error: "Team not found" });
    res.json(team);
  } catch (err) {
    console.error("Error fetching team:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// -- Get Team Members --
export const getTeamMembers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Relation way: Find users where (teams some id = teamId) OR (leadingTeams some id = teamId)
    // This ensures Leader is always included even if not explicitly in the 'members' m-n relation.
    const members = await prisma.user.findMany({
      where: {
        OR: [
          { teams: { some: { id } } },
          { leadingTeams: { some: { id } } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        skills: true,
        workload: true,
        role: true
      }
    });

    res.json(members);
  } catch (err) {
    console.error("Error getting team members:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// -- Get Team Tasks --
export const getTeamTasks = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tasks = await prisma.task.findMany({
      where: { teamId: id },
      include: {
        assignedTo: {
          select: { id: true, name: true }
        }
      }
    });
    res.json(tasks);
  } catch (err) {
    console.error("Error fetching team tasks:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// -- Invite Member --
export const inviteMember = async (req: Request, res: Response) => {
  try {
    const { id: teamId } = req.params;
    const { email } = req.body;
    // @ts-ignore
    const requesterId = req.user?.id;

    if (!email) return res.status(400).json({ error: "Email is required" });

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return res.status(404).json({ error: "Team not found" });

    // Check permissions (Leader only)
    if (team.leaderId !== requesterId) {
      return res.status(403).json({ error: "Only team leader can invite members" });
    }

    // Check if user is already in the team (if user exists)
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      // Check membership via relation
      const isMember = await prisma.team.findFirst({
        where: {
          id: teamId,
          members: { some: { id: existingUser.id } }
        }
      });
      if (isMember) {
        return res.status(400).json({ error: "User is already a member" });
      }
    } else {
      return res.status(400).json({ error: "User does not exist" });
    }

    // Check for pending invite
    const existingInvite = await prisma.invite.findUnique({
      where: {
        teamId_email: {
          teamId,
          email
        }
      }
    });

    if (existingInvite && existingInvite.expiresAt > new Date() && !existingInvite.acceptedAt) {
      return res.status(400).json({ error: "Invite already pending" });
    }

    // Generate secure token
    const crypto = await import("crypto");
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    if (existingInvite) {
      await prisma.invite.update({
        where: { id: existingInvite.id },
        data: {
          tokenHash,
          expiresAt,
          acceptedAt: null,
          createdAt: new Date()
        }
      });
    } else {
      await prisma.invite.create({
        data: {
          teamId,
          email,
          tokenHash,
          expiresAt,
          role: "member"
        }
      });
    }

    // Mock Email Send
    const inviteLink = `http://localhost:3000/invite?token=${rawToken}`;
    console.log(`[INVITE] Sending invite to ${email}: ${inviteLink}`);

    res.json({ message: "Invite sent", link: inviteLink });
  } catch (err) {
    console.error("Error inviting member:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// -- Update Team --
export const updateTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    // @ts-ignore
    const userId = req.user?.id;

    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) return res.status(404).json({ error: "Team not found" });

    if (team.leaderId !== userId) {
      return res.status(403).json({ error: "Only team leader can update team" });
    }

    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        name,
        desc: description,
      },
      select: {
        id: true,
        name: true,
        desc: true,
        leaderId: true,
      }
    });

    res.json(updatedTeam);
  } catch (err) {
    console.error("Error updating team:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// -- Delete Team --
export const deleteTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.user?.id;

    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) return res.status(404).json({ error: "Team not found" });

    if (team.leaderId !== userId) {
      return res.status(403).json({ error: "Only team leader can delete team" });
    }

    await prisma.team.delete({ where: { id } });

    res.json({ message: "Team deleted successfully" });
  } catch (err) {
    console.error("Error deleting team:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// -- Remove Member --
export const removeMember = async (req: Request, res: Response) => {
  try {
    const { id: teamId, userId: memberIdToRemove } = req.params;
    // @ts-ignore
    const requesterId = req.user?.id;

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return res.status(404).json({ error: "Team not found" });

    // Check permissions:
    // 1. Leader can remove anyone
    // 2. User can remove themselves
    if (team.leaderId !== requesterId && requesterId !== memberIdToRemove) {
      return res.status(403).json({ error: "Not authorized to remove this member" });
    }

    // Prevent removing the leader?
    if (memberIdToRemove === team.leaderId) {
      return res.status(400).json({ error: "Cannot remove team leader. Transfer leadership or delete team." });
    }

    await prisma.team.update({
      where: { id: teamId },
      data: {
        members: {
          disconnect: { id: memberIdToRemove }
        }
      }
    });

    res.json({ message: "Member removed successfully" });

  } catch (err) {
    console.error("Error removing member:", err);
    res.status(500).json({ error: "Server error" });
  }
};
