import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/users/[id]/tasks
export async function GET(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;

        const tasks = await prisma.task.findMany({
            where: {
                assignedToId: id,
                // Only show tasks if the user is STILL in the team or is the leader
                team: {
                    OR: [
                        { members: { some: { id } } },
                        { leaderId: id }
                    ]
                }
            },
            include: {
                team: true,
                assignedTo: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        return NextResponse.json(tasks);
    } catch (error) {
        console.error("Error fetching user tasks:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
