import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user || !user.email) {
            return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
        }

        // Received invites: matched by user's email, not accepted, not expired
        const received = await prisma.invite.findMany({
            where: {
                email: { equals: user.email, mode: "insensitive" },
                acceptedAt: null,
                expiresAt: { gt: new Date() }
            },
            include: {
                team: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        // Sent invites: where user is the leader of the team
        const sent = await prisma.invite.findMany({
            where: {
                team: {
                    leaderId: user.id
                }
            },
            include: {
                team: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return NextResponse.json({ received, sent });

    } catch (error) {
        console.error("Error fetching invites:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
