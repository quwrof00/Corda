import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        const { id } = await params;

        if (!user || !user.email) {
            return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
        }

        const invite = await prisma.invite.findUnique({
            where: { id },
            include: { team: true }
        });

        if (!invite) {
            return NextResponse.json({ error: "Invite not found" }, { status: 404 });
        }

        // Can delete if user is the recipient OR user is the team leader
        const isRecipient = user.email.toLowerCase() === invite.email.toLowerCase();
        const isLeader = user.id === invite.team.leaderId;

        if (!isRecipient && !isLeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await prisma.invite.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Invite deleted" });

    } catch (error) {
        console.error("Error deleting invite:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
