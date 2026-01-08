import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    props: { params: Promise<{ teamId: string }> }
) {
    try {
        const params = await props.params;
        const { teamId } = params;

        const members = await prisma.user.findMany({
            where: {
                OR: [
                    { teams: { some: { id: teamId } } },
                    { leadingTeams: { some: { id: teamId } } }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                skills: true,
                workload: true,
                role: true
            }
        });

        return NextResponse.json(members);
    } catch (error) {
        console.error("Error getting team members:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
