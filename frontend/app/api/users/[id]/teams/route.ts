import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/users/[id]/teams
export async function GET(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;

        const teams = await prisma.team.findMany({
            where: {
                members: {
                    some: { id }
                }
            },
            select: {
                id: true,
                name: true,
                desc: true,
                leader: {
                    select: { id: true, name: true, email: true }
                },
                members: {
                    select: { id: true }
                }
            }
        });

        return NextResponse.json(teams);
    } catch (error) {
        console.error("Error fetching user teams:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
