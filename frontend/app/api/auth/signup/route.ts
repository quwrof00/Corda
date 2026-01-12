import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "@/lib/mailer";

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

        // Generate verification token
        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token,
                expires
            }
        });

        const verifyLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

        try {
            await sendEmail(
                email,
                "Verify your email - Corda",
                `<div style="font-family: Arial, sans-serif; color: #333;">
                     <h2>Welcome to Corda!</h2>
                     <p>Please verify your email address to get started.</p>
                     <a href="${verifyLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
                     <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't create an account, you can ignore this email.</p>
                   </div>`
            );
        } catch (emailError) {
            console.error("Failed to send verification email:", emailError);
            // We don't fail registration if email fails, but you might want to handle it differently
        }

        return NextResponse.json(
            { message: "User registered successfully. Please check your email to verify." },
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
