import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail } from "@/lib/mailer";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();
        if (!email) {
            return NextResponse.json({ message: "Email is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        // Always return success to avoid leaking whether an email is registered
        if (!user) {
            return NextResponse.json({ message: "Reset link sent" }, { status: 200 });
        }

        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 3600000); // 1 hour

        // Delete any existing token for this email before creating a new one
        await prisma.verificationToken.deleteMany({ where: { identifier: email } });

        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token,
                expires
            }
        });

        // Build the reset link, correctly preferring NEXT_PUBLIC_APP_URL first
        const appUrl =
            process.env.NEXT_PUBLIC_APP_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
        const resetLink = `${appUrl}/reset-password?token=${token}`;

        const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Reset Password</h2>
        <p>You requested a password reset for your Corda account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't ask for this, you can ignore this email.</p>
      </div>
    `;

        await sendEmail(email, "Reset Your Password - Corda", html);

        return NextResponse.json({ message: "Reset link sent" }, { status: 200 });

    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ message: "Failed to process request" }, { status: 500 });
    }
}
