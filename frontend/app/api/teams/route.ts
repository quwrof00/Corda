import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/session";

// GET /api/teams - List all teams for the current user
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const teams = await prisma.team.findMany({
            where: {
                members: {
                    some: { id: user.id }
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
        console.error("Error getting teams:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// POST /api/teams - Create a new team
export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, description, members = [] } = await req.json();

        if (!name || typeof name !== "string") {
            return NextResponse.json({ error: "Missing or invalid field: name" }, { status: 400 });
        }

        if (!Array.isArray(members)) {
            return NextResponse.json({ error: "members must be an array" }, { status: 400 });
        }

        // Normalize + dedupe members
        const memberSet = new Set<string>(members.map(String));
        memberSet.add(user.id); // creator must be a member

        const finalMembers = Array.from(memberSet);

        // Validate all members exist
        const existingUsers = await prisma.user.findMany({
            where: { id: { in: finalMembers } },
            select: { id: true }
        });

        if (existingUsers.length !== finalMembers.length) {
            return NextResponse.json({ error: "One or more members do not exist" }, { status: 400 });
        }

        const team = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            return tx.team.create({
                data: {
                    name,
                    desc: description || null,
                    leaderId: user.id,
                    members: {
                        connect: finalMembers.map((id) => ({ id }))
                    }
                },
                select: {
                    id: true,
                    name: true,
                    leaderId: true,
                }
            });
        });

        return NextResponse.json(team, { status: 201 });
    } catch (error) {
        console.error("Error creating team:", error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            return NextResponse.json({ error: "Unique constraint failed" }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
    }
}