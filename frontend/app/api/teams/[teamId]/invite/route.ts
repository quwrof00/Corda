import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import crypto from "crypto";
import { sendEmail } from "@/lib/mailer";

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
        interface TeamType {
            id: string;
            name: string;
            leaderId: string | null;
            enableAll: boolean;
        }

        const team = await prisma.team.findUnique({
            where: { id: teamId },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            select: { id: true, name: true, leaderId: true, enableAll: true } as any
        }) as unknown as TeamType;
        if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

        if (team.leaderId !== user.id && !team.enableAll) {
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
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;
        const inviteLink = `${baseUrl}/invite?token=${rawToken}`;

        try {
            await sendEmail(
                email,
                `Join ${team.name} on TaskAllo`,
                `<div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>You've been invited!</h2>
                    <p>You have been invited to join the team <strong>${team.name}</strong> on TaskAllo.</p>
                    <p>Click the button below to accept the invitation:</p>
                    <a href="${inviteLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Join Team</a>
                    <p style="margin-top: 20px; font-size: 12px; color: #666;">Link expires in 7 days.</p>
                </div>`
            );
            return NextResponse.json({ message: "Invite sent successfully", link: inviteLink });
        } catch (emailError) {
            console.error("Failed to send invite email:", emailError);
            return NextResponse.json({ error: "Failed to send invite email" }, { status: 500 });
        }
    } catch (error) {
        console.error("Error inviting member:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
