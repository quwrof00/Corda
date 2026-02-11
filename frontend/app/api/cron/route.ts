import { NextResponse } from 'next/server';
import { processRecurringTasks } from '@/lib/cron';

// This route can be triggered manually or via Vercel Cron
export async function GET(request: Request) {
    try {
        // Optional: Add authentication check here
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        await processRecurringTasks();

        return NextResponse.json({ success: true, message: 'Recurring tasks processed' });
    } catch (error) {
        console.error('Error processing recurring tasks:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to process recurring tasks' },
            { status: 500 }
        );
    }
}
