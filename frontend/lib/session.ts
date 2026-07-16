import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { headers } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

interface MobileTokenPayload {
  id: string;
  email: string;
  name: string;
}

/**
 * Returns the current user from either:
 * 1. A Bearer JWT token in the Authorization header (mobile app)
 * 2. A NextAuth session cookie (web app)
 *
 * Route handlers do NOT need to pass `req` — uses Next.js headers() API.
 */
export async function getCurrentUser() {
  // 1. Check for Bearer token (mobile)
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const payload = jwt.verify(token, JWT_SECRET) as MobileTokenPayload;
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, name: true, email: true, image: true },
      });
      if (user) {
        return { id: user.id, name: user.name ?? "", email: user.email, image: user.image };
      }
    }
  } catch {
    // Invalid token or no auth header — fall through to NextAuth
  }

  // 2. Fall back to NextAuth session cookie (web)
  const session = await getServerSession(getAuthOptions());
  return session?.user ?? null;
}
