import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import crypto from "crypto";

export async function POST(
    req: Request,
    props: { params: Promise<{ teamId: string }> }
) {
    try {
        const params = await props.params;
        const { teamId } = params;
        const user = await getCurrentUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { email } = await req.json();

        if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

        if (team.leaderId !== user.id) {
            return NextResponse.json({ error: "Only team leader can invite members" }, { status: 403 });
        }

        // Check if user is already in the team (if user exists)
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            const isMember = await prisma.team.findFirst({
                where: {
                    id: teamId,
                    members: { some: { id: existingUser.id } }
                }
            });
            if (isMember) {
                return NextResponse.json({ error: "User is already a member" }, { status: 400 });
            }
        } else {
            return NextResponse.json({ error: "User does not exist" }, { status: 400 });
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
            return NextResponse.json({ error: "Invite already pending" }, { status: 400 });
        }

        // Generate secure token
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

        // Start with relative URL
        // Use window.location.origin in client OR process.env.NEXT_PUBLIC_APP_URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
        const inviteLink = `${baseUrl}/invite?token=${rawToken}`;

        // In production we should send email
        console.log(`[INVITE] Sending invite to ${email}: ${inviteLink}`);

        return NextResponse.json({ message: "Invite sent", link: inviteLink });
    } catch (error) {
        console.error("Error inviting member:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
