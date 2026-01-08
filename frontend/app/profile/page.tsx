import { getServerSession } from "next-auth/next";
import { getAuthOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileClient from "./profile-client";

export default async function ProfilePage() {
    const session = await getServerSession(getAuthOptions());

    if (!session) {
        redirect("/login");
    }

    const userId = session.user.id;

    let initialUser = null;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                skills: true,
                workload: true,
                role: true,
                teams: {
                    select: { id: true, name: true }
                }
            }
        });
        initialUser = user;
    } catch (error) {
        console.error("Failed to fetch user data server-side:", error);
    }

    return <ProfileClient initialUser={initialUser} userId={userId} />;
}
