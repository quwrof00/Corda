import { prisma } from "@/lib/prisma";
import axios from "axios";
import crypto from "crypto";
import ical from "node-ical";

export async function syncMoodleTasks(userId: string, force = false) {
    try {
        const integration = await prisma.moodleIntegration.findUnique({
            where: { userId },
        });

        if (!integration || !integration.isActive) {
            return { success: false, message: "No active integration found" };
        }

        // Check if enough time has passed (unless forced)
        if (!force && integration.lastSyncedAt) {
            const hoursSinceLastSync =
                (Date.now() - integration.lastSyncedAt.getTime()) / (1000 * 60 * 60);
            if (hoursSinceLastSync < integration.syncFrequencyHours) {
                return { success: true, message: "Skipped (recently synced)", skipped: true };
            }
        }

        // Step 1: Fetch ICS
        const response = await axios.get(integration.icsUrl);
        const rawICSString = response.data;

        // Step 2: Generate hash
        const hash = crypto
            .createHash("sha256")
            .update(rawICSString)
            .digest("hex");

        // Check if content changed
        if (!force && integration.lastSyncHash === hash) {
            // Update lastSyncedAt anyway to prevent re-checking too soon
            await prisma.moodleIntegration.update({
                where: { id: integration.id },
                data: { lastSyncedAt: new Date() }
            });
            return { success: true, message: "Skipped (content unchanged)", skipped: true };
        }

        // Step 3: Parse events
        const events = ical.parseICS(rawICSString);
        let taskCount = 0;

        // Step 4: Upsert tasks
        for (const key in events) {
            if (Object.prototype.hasOwnProperty.call(events, key)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const event = events[key] as any;
                if (event.type === "VEVENT") {
                    const externalId = event.uid;

                    // Should verify we have a teamId to assign to. 
                    // For now, we might need a default team or create a "Personal" team context if allowed.
                    // However, the Task model REQUIRES a teamId. 
                    // We should probably ask the user to select a team when setting up integration, or default to a "Personal" team if one exists.
                    // For this implementation, I will assume we find or create a 'Personal' team for the user? 
                    // Or better, let's look for any team the user is in.
                    // Actually, best to fetch the user's personal team. 
                    // If the schema supports it. The schema has Teams and Members.

                    // Let's rely on finding a team named "Personal" or just the first team they are in for now?
                    // Or maybe created as unassigned if teamId wasn't required? schema says teamId String (required).

                    // QUICK FIX: Find the first team the user is a member of. 
                    // Real solution: Add `defaultTeamId` to MoodleIntegration.

                    const userTeams = await prisma.team.findMany({
                        where: { members: { some: { id: userId } } },
                        take: 1
                    });

                    if (userTeams.length === 0) {
                        // No team found, cannot create task.
                        console.warn(`User ${userId} has no teams. Skipping task creation.`);
                        continue;
                    }

                    const teamId = userTeams[0].id;

                    await prisma.task.upsert({
                        where: {
                            externalId_assignedToId: {
                                externalId: externalId,
                                assignedToId: userId
                            }
                        },
                        update: {
                            title: event.summary,
                            desc: event.description,
                            deadline: event.end || event.start, // Fallback if no end
                        },
                        create: {
                            title: event.summary,
                            desc: event.description,
                            deadline: event.end || event.start,
                            source: "moodle",
                            externalId: externalId,
                            assignedToId: userId,
                            teamId: teamId,
                            priority: "Medium",
                            status: "pending"
                        },
                    });
                    taskCount++;
                }
            }
        }

        // Update integration state
        await prisma.moodleIntegration.update({
            where: { id: integration.id },
            data: {
                lastSyncedAt: new Date(),
                lastSyncHash: hash,
            },
        });

        return { success: true, count: taskCount };

    } catch (error) {
        console.error("Moodle sync error:", error);
        return { success: false, error: String(error) };
    }
}
