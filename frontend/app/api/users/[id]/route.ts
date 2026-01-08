import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { formatSkill } from "@/lib/skills";

export async function GET(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                skills: true,
                workload: true,
                role: true,
                teams: {
                    select: { id: true, name: true }
                }
            }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
        return NextResponse.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;
        const currentUser = await getCurrentUser();

        if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        if (currentUser.id !== id) {
            return NextResponse.json({ error: "Unauthorized: You can only update your own profile" }, { status: 403 });
        }

        const { name, skills } = await req.json();

        const dataToUpdate: {
            name?: string;
            skills?: string[];
        } = {};

        if (name !== undefined) dataToUpdate.name = name;
        if (skills !== undefined) {
            dataToUpdate.skills = Array.isArray(skills)
                ? skills.map(formatSkill).filter(Boolean)
                : [];
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: dataToUpdate
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}