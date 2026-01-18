import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TasksClient from "./tasks-client";
import { redirect } from "next/navigation";

export default async function TasksPage() {
    const session = await getServerSession(getAuthOptions());

    if (!session) {
        redirect("/login");
    }

    const userId = session.user.id;

    const tasks = await prisma.task.findMany({
        where: {
            assignedToId: userId
        },
        include: {
            team: true,
            assignedTo: {
                select: { id: true, name: true, email: true }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const serializedTasks = JSON.parse(JSON.stringify(tasks));

    return <TasksClient initialTasks={serializedTasks} userId={userId} />;
}
