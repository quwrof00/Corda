import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { inngest } from "@/lib/inngest/client";

export async function POST(
    req: Request,
    props: { params: Promise<{ teamId: string }> }
) {
    try {
        const params = await props.params;
        const { teamId } = params;
        const user = await getCurrentUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Basic validation that team exists and user is leader
        // We still do this to prevent spamming events for invalid teams
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            select: { leaderId: true }
        });

        if (!team) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }

        if (team.leaderId !== user.id) {
            return NextResponse.json({ error: "Only team leader can run allocation" }, { status: 403 });
        }

        // 2️⃣ API endpoint (VERY thin)
        // trigger Inngest event
        await inngest.send({
            name: "team.allocate.requested",
            data: { teamId }
        });

        return NextResponse.json({ status: "allocation_started" });

    } catch (error) {
        console.error("Error triggering allocation:", error);
        return NextResponse.json({ error: "Failed to trigger allocation" }, { status: 500 });
    }
}
