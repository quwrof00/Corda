import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TeamsClient from "./teams-client";
import { redirect } from "next/navigation";

export default async function TeamsPage() {
    const session = await getServerSession(getAuthOptions());

    if (!session) {
        redirect("/login");
    }

    const userId = session.user.id;

    const teams = await prisma.team.findMany({
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
            }
        }
    });

    const serializedTeams = JSON.parse(JSON.stringify(teams));

    return <TeamsClient initialTeams={serializedTeams} />;
}
