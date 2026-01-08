import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    props: { params: Promise<{ teamId: string }> }
) {
    try {
        const params = await props.params;
        const { teamId } = params;

        const tasks = await prisma.task.findMany({
            where: { teamId },
            include: {
                assignedTo: {
                    select: { id: true, name: true }
                }
            }
        });

        return NextResponse.json(tasks);
    } catch (error) {
        console.error("Error fetching team tasks:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
