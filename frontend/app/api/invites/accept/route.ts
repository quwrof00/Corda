import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const { token } = await req.json();
        const user = await getCurrentUser();

        if (!user || !user.email) {
            return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
        }

        if (!token) return NextResponse.json({ error: "Token is required" }, { status: 400 });

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
            return NextResponse.json({ error: "Invalid or expired invite" }, { status: 400 });
        }

        // Check if invite email matches logged in user email
        if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
            // Technically we can just use user.email, but for security strictness:
            return NextResponse.json({ error: "This invite was sent to a different email address" }, { status: 403 });
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
            await prisma.invite.update({
                where: { id: invite.id },
                data: { acceptedAt: new Date() }
            });
            return NextResponse.json({ message: "You are already a member of this team", teamId: invite.teamId });
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
            prisma.invite.update({
                where: { id: invite.id },
                data: { acceptedAt: new Date() }
            })
        ]);

        return NextResponse.json({ message: "Invite accepted", teamId: invite.teamId });

    } catch (error) {
        console.error("Error accepting invite:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
