import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getCanonicalSkill, formatSkill } from "@/lib/skills";

// GET /api/tasks - Get all tasks assigned to current user
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const tasks = await prisma.task.findMany({
            where: {
                assignedToId: user.id
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
        console.error("Error fetching tasks:", error);
        return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }
}

// POST /api/tasks - Create a new task
export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const {
            title,
            description,
            deadline,
            requiredSkill,
            priority,
            assignedToId,
            teamId,
            status = "pending",
        } = await req.json();

        if (!teamId || !title || !requiredSkill || !deadline) {
            return NextResponse.json({ error: "Missing required fields (title, teamId, requiredSkill, deadline)" }, { status: 400 });
        }

        const newTask = await prisma.task.create({
            data: {
                title,
                desc: description,
                deadline: new Date(deadline),
                requiredSkill: getCanonicalSkill(requiredSkill) || formatSkill(requiredSkill),
                priority,
                status,
                teamId,
                assignedToId: assignedToId || null,
            }
        });

        return NextResponse.json(newTask, { status: 201 });
    } catch (error) {
        console.error("Error creating task:", error);
        return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }
}
