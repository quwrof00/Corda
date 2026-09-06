import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { publishTeamEvent } from "@/lib/socket";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        const { id } = await params;

        if (!user || !user.email) {
            return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
        }

        const invite = await prisma.invite.findFirst({
            where: {
                id,
                expiresAt: { gt: new Date() },
                acceptedAt: null
            }
        });

        if (!invite) {
            return NextResponse.json({ error: "Invalid or expired invite" }, { status: 400 });
        }

        // Check if invite email matches logged in user email
        if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
            return NextResponse.json({ error: "This invite was sent to a different email address" }, { status: 403 });
        }

        // Check if already member
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

        // Real-time notification
        await publishTeamEvent(invite.teamId, {
            type: "MEMBER_ADDED",
            payload: { userId: user.id, name: user.name },
            meta: { triggeredBy: user.id }
        });

        return NextResponse.json({ message: "Invite accepted", teamId: invite.teamId });

    } catch (error) {
        console.error("Error accepting invite by id:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
