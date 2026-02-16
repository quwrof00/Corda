import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { publishTeamEvent } from "@/lib/socket";
import axios from "axios";

import crypto from "crypto";

import { parseICS } from "@/lib/simple-ical";
import https from "https";

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { icsUrl, syncNow, force } = await req.json();

        if (icsUrl) {
            // Validate URL
            try {
                new URL(icsUrl);
            } catch {
                return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
            }

            // Upsert integration config
            await prisma.moodleIntegration.upsert({
                where: { userId: user.id },
                update: { icsUrl, isActive: true },
                create: {
                    userId: user.id,
                    icsUrl,
                    isActive: true
                }
            });
        }

        if (syncNow) {
            // Trigger sync logic
            const integration = await prisma.moodleIntegration.findUnique({
                where: { userId: user.id },
            });

            if (!integration) {
                return NextResponse.json({ message: "Integration not set up" });
            }

            // 1. Fetch with SSL bypass
            const agent = new https.Agent({
                rejectUnauthorized: false
            });

            const response = await axios.get(integration.icsUrl, { httpsAgent: agent });
            const rawICSString = response.data;

            // 2. Hash
            const hash = crypto
                .createHash("sha256")
                .update(rawICSString)
                .digest("hex");

            if (!force && integration.lastSyncHash === hash) {
                await prisma.moodleIntegration.update({
                    where: { id: integration.id },
                    data: { lastSyncedAt: new Date() }
                });
                return NextResponse.json({ message: "Skipped (unchanged)", skipped: true });
            }

            // 3. Parse and Upsert
            const events = parseICS(rawICSString);
            let count = 0;

            // Get the user's Personal team
            const personalTeam = await prisma.team.findFirst({
                where: {
                    members: { some: { id: user.id } },
                    name: "Personal"
                }
            });

            if (personalTeam) {
                const teamId = personalTeam.id;

                for (const key in events) {
                    if (Object.prototype.hasOwnProperty.call(events, key)) {
                        const event = events[key];
                        if (event.uid) {
                            await prisma.task.upsert({
                                where: {
                                    externalId_assignedToId: {
                                        externalId: event.uid,
                                        assignedToId: user.id
                                    }
                                },
                                update: {
                                    title: event.summary || "Untitled Moodle Task",
                                    desc: event.description
                                        ? `${event.categories} - ${event.description || ""}`
                                        : event.categories || "",
                                    deadline: event.end || event.start || new Date(),
                                    teamId: teamId, // Ensure existing tasks move to Personal team
                                },
                                create: {
                                    title: event.summary || "Untitled Moodle Task",
                                    desc: event.description
                                        ? `${event.categories} - ${event.description || ""}`
                                        : event.categories || "",
                                    deadline: event.end || event.start || new Date(),
                                    source: "moodle",
                                    externalId: event.uid,
                                    assignedToId: user.id,
                                    teamId: teamId,
                                    priority: "Medium",
                                    status: "pending"
                                }
                            });
                            count++;
                        }
                    }
                }

                // Real-time notification
                if (count > 0) {
                    await publishTeamEvent(teamId, {
                        type: "TASK_CREATED",
                        payload: { message: `Synced ${count} tasks from Moodle` },
                        meta: { triggeredBy: user.id }
                    });
                }
            }

            await prisma.moodleIntegration.update({
                where: { id: integration.id },
                data: {
                    lastSyncedAt: new Date(),
                    lastSyncHash: hash
                }
            });

            return NextResponse.json({ message: "Synced successfully", count });
        }

        return NextResponse.json({ message: "Configuration saved" });

    } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = error as any;
        console.error("Moodle sync error:", e.message || e);
        return NextResponse.json({ error: "Sync failed: " + (e.message || "Unknown error") }, { status: 500 });
    }
}

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const integration = await prisma.moodleIntegration.findUnique({
            where: { userId: user.id }
        });

        return NextResponse.json(integration);
    } catch (error) {
        console.error("Error fetching integration:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
