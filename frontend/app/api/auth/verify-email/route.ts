import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { token } = await req.json();

        if (!token) {
            return NextResponse.json(
                { message: "Token is required" },
                { status: 400 }
            );
        }

        const storedToken = await prisma.verificationToken.findUnique({
            where: { token }
        });

        if (!storedToken || storedToken.expires < new Date()) {
            return NextResponse.json(
                { message: "Invalid or expired token" },
                { status: 400 }
            );
        }

        const { identifier: email } = storedToken;

        // Verify User
        await prisma.user.update({
            where: { email },
            data: { emailVerified: new Date() }
        });

        // Clean up used token
        await prisma.verificationToken.delete({ where: { token } });

        return NextResponse.json(
            { message: "Email verified successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Verify email error:", error);
        return NextResponse.json(
            { message: "Failed to verify email" },
            { status: 500 }
        );
    }
}
