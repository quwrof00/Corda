import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { allocateTeam } from "@/lib/inngest/functions";

// Create an API that serves zero-latency Inngest functions
export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        allocateTeam,
    ],
});
