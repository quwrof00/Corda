# Recurring Tasks Implementation Guide

This guide documents the recurring task system implemented using `node-cron` and Next.js instrumentation.

## Overview

The system automatically generates new tasks based on `Recurrence` rules defined in the database. A background cron job runs at regular intervals (dev: every minute, prod: hourly) to check for due recurrences.

## Components

### 1. Database Schema
- **`Recurrence` Model**: Stores scheduling rules (`frequency`, `interval`, `daysOfWeek`, etc.).
- **`Task` Model**: Linked to a recurrence via `recurrenceId`. The system uses the most recent task of a recurrence as a template for the next one.

### 2. Cron Job (`lib/cron.ts`)
- **Singleton Pattern**: Ensures only one cron job instance runs, even during Next.js hot reloads in development.
- **Scheduling**:
  - **Development**: Runs every minute (`* * * * *`) for easy testing.
  - **Production**: Runs hourly (`0 * * * *`) to save resources.
- **Logic**:
  1. Finds `Recurrence` records where `nextRunAt <= Now`.
  2. Gets the latest task associated with that recurrence.
  3. Creates a new task with the same details (title, priority, etc.) but a new deadline calculated based on the original task's duration.
  4. Calculates the *new* `nextRunAt` date based on the frequency rules (Daily, Weekly, Monthly) and updates the `Recurrence` record.

### 3. Server Integration (`instrumentation.ts`)
- Uses Next.js `register()` hook to start the cron job when the server boots.
- Runs only in the `nodejs` runtime.
- **Development**: Great for testing.
- **Production (VPS/Dedicated)**: Works well if you run a single instance.
- **Production (Serverless/Vercel)**: `node-cron` inside `instrumentation.ts` is NOT reliable because serverless functions freeze/shutdown. Use Vercel Cron instead.

### 4. API Endpoint (`app/api/cron/route.ts`)
- A GET endpoint at `/api/cron` allows manual triggering of the processing logic.
- Protected by `Authorization` header if `CRON_SECRET` is set in environment variables.
- **Vercel Cron**: Calls this endpoint automatically.

## Production Setup (Vercel)

For production deployment on Vercel:

1. **Delete/Identify `instrumentation.ts`**: The `node-cron` usage in `instrumentation.ts` is for long-running servers. On Vercel, it won't run continuously. You can keep it (it won't hurt, but won't work reliably) or switch to relying solely on the HTTP endpoint.
2. **Vercel Cron**: The project includes a `vercel.json` file configured for **Hourly** execution:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron",
         "schedule": "0 * * * *"
       }
     ]
   }
   ```
   *Note: Every minute (`* * * * *`) is often too frequent for production and may hit usage limits.*
3. **Environment Variables**:
   - Set `CRON_SECRET` in Vercel settings to a strong random string.
   - Vercel Cron automatically signs requests so you don't strictly need the secret check *if* you rely on Vercel's protections, but our API route checks for `Bearer <CRON_SECRET>` for security if manual triggering is needed or for cross-platform compatibility.

## FAQ

### Does strict recurring require a Deadline?
Yes and No.
- **`Recurrence.endDate`**: Defines when the *series* of recurring tasks stops forever (e.g. "Stop creating tasks after Dec 31").
- **`Task.deadline`**: Each *individual* task instance created by the system needs a deadline (e.g., "The task for this week is due Friday at 5 PM").
- **Logic**: The system calculates the new task's deadline by preserving the duration of the original setup task.
  - *Example*: You create a task on Monday at 9 AM with a deadline of Friday at 5 PM (Duration: 4d 8h).
  - You set it to recur "Weekly".
  - Next Monday at 9 AM, the system creates a new task. Its deadline will be set to Next Friday at 5 PM (Creation Time + 4d 8h).

### How to handle scaling?
If you deploy to a cluster (e.g., Kubernetes) with 5 replicas:
- **`node-cron`**: Will run on ALL 5 pods -> 5 duplicate tasks created.
- **Solution**:
  1. Use Vercel Cron / External Cron (hits the load balancer, routed to one pod).
  2. Implement a distributed lock (e.g., Redis) in `lib/cron.ts` if sticking with internal cron.

## Troubleshooting

- **Cron not running**: Verify `instrumentation.ts` is in the project root.
- **Duplicates in Dev**: Restart dev server to clear old `global` references.
