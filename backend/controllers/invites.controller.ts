import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import crypto from "crypto";

export const acceptInvite = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        // @ts-ignore
        const userEmail = req.user?.email;

        if (!userEmail) {
            return res.status(401).json({ error: "Unauthenticated" });
        }
        if (!token) return res.status(400).json({ error: "Token is required" });

        // Hash the token to compare
        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const invite = await prisma.invite.findFirst({
            where: {
                tokenHash,
                expiresAt: { gt: new Date() },
                acceptedAt: null
            }
        });

        if (!invite) {
            return res.status(400).json({ error: "Invalid or expired invite" });
        }

        // Fix: Resolve user by email, NOT id
        const user = await prisma.user.findUnique({
            where: { email: userEmail }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.email !== invite.email) {
            return res.status(403).json({ error: "This invite was sent to a different email address" });
        }

        // Check if already member (using Relation)
        const existingMembership = await prisma.team.findFirst({
            where: {
                id: invite.teamId,
                members: {
                    some: { id: user.id }
                }
            }
        });

        if (existingMembership) {
            // Already member, just mark invite accepted
            await prisma.invite.update({
                where: { id: invite.id },
                data: { acceptedAt: new Date() }
            });
            return res.json({ message: "You are already a member of this team", teamId: invite.teamId });
        }

        // Execute Transaction
        await prisma.$transaction([
            prisma.team.update({
                where: { id: invite.teamId },
                data: {
                    members: {
                        connect: { id: user.id }
                    }
                }
            }),
            // Note: No need to update user.teamIds manually anymore due to relation
            prisma.invite.update({
                where: { id: invite.id },
                data: { acceptedAt: new Date() }
            })
        ]);

        res.json({ message: "Invite accepted", teamId: invite.teamId });

    } catch (err) {
        console.error("Error accepting invite:", err);
        res.status(500).json({ error: "Server error" });
    }
};
