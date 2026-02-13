import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/session";
import { publishTeamEvent } from "@/lib/socket";

export async function DELETE(
    req: Request,
    props: { params: Promise<{ teamId: string; userId: string }> } // Note: Route is [userId]
) {
    try {
        const params = await props.params;
        const { teamId, userId: memberIdToRemove } = params;
        const currentUser = await getCurrentUser();

        if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

        // Check permissions:
        // 1. Leader can remove anyone
        // 2. User can remove themselves
        // 3. Open permissions allow anyone to remove anyone
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (team.leaderId !== currentUser.id && currentUser.id !== memberIdToRemove && !(team as any).enableAll) {
            return NextResponse.json({ error: "Not authorized to remove this member" }, { status: 403 });
        }

        if (memberIdToRemove === team.leaderId) {
            return NextResponse.json({ error: "Cannot remove team leader. Transfer leadership or delete team." }, { status: 400 });
        }

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Remove member from team
            await tx.team.update({
                where: { id: teamId },
                data: {
                    members: {
                        disconnect: { id: memberIdToRemove }
                    }
                }
            });

            // 2. Delete all tasks assigned to this user in this team
            await tx.task.deleteMany({
                where: {
                    teamId: teamId,
                    assignedToId: memberIdToRemove
                }
            });
        });

        // Real-time notification
        await publishTeamEvent(teamId, {
            type: "MEMBER_REMOVED",
            payload: { userId: memberIdToRemove },
            meta: { triggeredBy: currentUser.id }
        });

        return NextResponse.json({ message: "Member removed successfully" });
    } catch (error) {
        console.error("Error removing member:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
