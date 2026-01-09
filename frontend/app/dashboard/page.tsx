import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./dashboard-client";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const session = await getServerSession(getAuthOptions());

    if (!session) {
        redirect("/login");
    }

    const userId = session.user.id;

    // Parallel data fetching
    const [tasks, teams] = await Promise.all([
        prisma.task.findMany({
            where: {
                assignedToId: userId
            },
            include: {
                team: true,
                assignedTo: {
                    select: { id: true, name: true, email: true }
                }
            }
        }),
        prisma.team.findMany({
            where: {
                members: {
                    some: { id: userId }
                }
            },
            select: {
                id: true,
                name: true,
                desc: true,
                leader: {
                    select: { id: true, name: true, email: true }
                },
                members: {
                    select: { id: true }
                },
                tasks: {
                    where: {
                        assignedToId: userId,
                        status: { not: "completed" }
                    },
                    select: { id: true }
                },
                _count: {
                    select: {
                        tasks: {
                            where: {
                                assignedToId: null,
                                status: { not: "completed" }
                            }
                        }
                    }
                }
            }
        })
    ]);

    // Serializing dates/complex objects if necessary
    const serializedTasks = JSON.parse(JSON.stringify(tasks));
    const serializedTeams = JSON.parse(JSON.stringify(teams));

    return (
        <DashboardClient
            initialTasks={serializedTasks}
            initialTeams={serializedTeams}
        />
    );
}
