import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json(
                { message: "Token and password required" },
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

        const hashed = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { email: storedToken.identifier },
            data: { password: hashed }
        });

        await prisma.verificationToken.delete({ where: { token } });

        return NextResponse.json(
            { message: "Password updated successfully" },
            { status: 200 }
        );

    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json(
            { message: "Failed to reset password" },
            { status: 500 }
        );
    }
}
