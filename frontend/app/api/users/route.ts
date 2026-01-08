import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/users - Get all users
export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                skills: true,
                workload: true,
                role: true,
            }
        });
        return NextResponse.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
