import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { message: "Name, email, and password are required" },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findFirst({ where: { email } });
        if (existingUser) {
            return NextResponse.json(
                { message: "Email already registered" },
                { status: 400 }
            );
        }

        const hashed = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: { name, email, password: hashed },
        });

        return NextResponse.json(
            { message: "User registered successfully" },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { message: "Failed to register user" },
            { status: 500 }
        );
    }
}
