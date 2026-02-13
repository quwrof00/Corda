import { redis } from "./redis";

export interface TeamEvent {
    type: "TASK_CREATED" | "TASK_UPDATED" | "TASK_DELETED" | "COMMENT_ADDED" | "STATUS_CHANGED" | "MEMBER_ADDED" | "MEMBER_REMOVED" | "ALLOCATION_UPDATE" | string;
    payload: any;
    teamId?: string;
    meta?: {
        triggeredBy?: string;
        timestamp?: number;
    };
}

export async function publishTeamEvent(teamId: string, event: TeamEvent) {
    // Ensure meta exists
    if (!event.meta) {
        event.meta = {};
    }
    // Add timestamp if missing
    if (!event.meta.timestamp) {
        event.meta.timestamp = Date.now();
    }
    // Ensure teamId matches channel
    if (!event.teamId) {
        event.teamId = teamId;
    }

    // Publish to Redis channel "team:{teamId}"
    // This matches the psubscribe pattern "team:*" in server.ts
    await redis.publish(`team:${teamId}`, JSON.stringify(event));
}
