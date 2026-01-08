import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// GET /api/teams/[teamId] - Get single team
export async function GET(
    req: Request,
    props: { params: Promise<{ teamId: string }> }
) {
    try {
        const params = await props.params;
        const { teamId } = params;

        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                leader: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
        return NextResponse.json(team);
    } catch (error) {
        console.error("Error fetching team:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// PUT /api/teams/[teamId] - Update team
export async function PUT(
    req: Request,
    props: { params: Promise<{ teamId: string }> }
) {
    try {
        const params = await props.params;
        const { teamId } = params;
        const user = await getCurrentUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { name, description } = await req.json();

        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

        if (team.leaderId !== user.id) {
            return NextResponse.json({ error: "Only team leader can update team" }, { status: 403 });
        }

        const updatedTeam = await prisma.team.update({
            where: { id: teamId },
            data: {
                name,
                desc: description,
            },
            select: {
                id: true,
                name: true,
                desc: true,
                leaderId: true,
            }
        });

        return NextResponse.json(updatedTeam);
    } catch (error) {
        console.error("Error updating team:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// DELETE /api/teams/[teamId] - Delete team
export async function DELETE(
    req: Request,
    props: { params: Promise<{ teamId: string }> }
) {
    try {
        const params = await props.params;
        const { teamId } = params;
        const user = await getCurrentUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

        if (team.leaderId !== user.id) {
            return NextResponse.json({ error: "Only team leader can delete team" }, { status: 403 });
        }

        await prisma.team.delete({ where: { id: teamId } });

        return NextResponse.json({ message: "Team deleted successfully" });
    } catch (error) {
        console.error("Error deleting team:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
