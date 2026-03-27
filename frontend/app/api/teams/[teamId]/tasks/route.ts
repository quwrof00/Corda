import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    props: { params: Promise<{ teamId: string }> }
) {
    try {
        const params = await props.params;
        const { teamId } = params;
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, Number(searchParams.get("page") || "1"));
        const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "30")));

        const where = { teamId };
        const [tasks, total] = await Promise.all([
            prisma.task.findMany({
                where,
                include: {
                    assignedTo: {
                        select: { id: true, name: true }
                    }
                },
                orderBy: [
                    { createdAt: "desc" },
                    { id: "desc" }
                ],
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.task.count({ where }),
        ]);

        return NextResponse.json({
            items: tasks,
            page,
            limit,
            total,
            hasMore: page * limit < total,
            nextPage: page * limit < total ? page + 1 : null,
        });
    } catch (error) {
        console.error("Error fetching team tasks:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
