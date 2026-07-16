import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

/**
 * POST /api/auth/mobile-register
 * Creates a new user account and returns a JWT token.
 * Note: email verification is skipped for mobile v1 (can be enabled later).
 */
export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);

    // Create user + personal team in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashed,
          emailVerified: new Date(), // Auto-verify for mobile
        },
      });

      // Create personal workspace team
      await tx.team.create({
        data: {
          name: "Personal",
          leaderId: newUser.id,
          members: { connect: { id: newUser.id } },
        },
      });

      return newUser;
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });
  } catch (err) {
    console.error("[mobile-register]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
