import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(getAuthOptions());

        if (!session || !session.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const userEmail = session.user.email;

        // Find User ID
        const user = await prisma.user.findUnique({
            where: { email: userEmail },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Check for existing Personal team
        let personalTeam = await prisma.team.findFirst({
            where: {
                leaderId: user.id,
                name: "Personal"
            }
        });

        // Create if not exists
        if (!personalTeam) {
            personalTeam = await prisma.team.create({
                data: {
                    name: "Personal",
                    desc: "Your personal workspace for private tasks",
                    leaderId: user.id,
                    members: {
                        connect: { id: user.id }
                    }
                }
            });
        }

        return NextResponse.json({ id: personalTeam.id });
    } catch (error) {
        console.error("Error fetching personal workspace:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
