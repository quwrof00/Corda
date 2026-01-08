import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const getAuthOptions = (): NextAuthOptions => ({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<string, string> | undefined) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Missing email or password");
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user || !user.password) {
            throw new Error("Invalid login");
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            throw new Error("Invalid password");
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role || undefined,
          };

        } catch (error) {
          console.error("Auth error:", error);
          const message = error instanceof Error ? error.message : "Login failed";
          throw new Error(message);
        }
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Sync Google users to DB on login
      if (account && user) {
        if (account.provider === "google") {
          try {
            const email = user.email!;
            let dbUser = await prisma.user.findUnique({ where: { email } });

            if (!dbUser) {
              // Create user
              const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
              const hashed = await bcrypt.hash(randomPassword, 10);

              dbUser = await prisma.user.create({
                data: {
                  email,
                  name: user.name || email.split("@")[0],
                  image: user.image,
                  password: hashed,
                  emailVerified: new Date(),
                }
              });
            }

            token.id = dbUser.id;
            token.role = dbUser.role || undefined;
            token.name = dbUser.name || undefined;
            token.image = dbUser.image || undefined;

          } catch (error) {
            console.error("Google Auth Sync Error:", error);
            // Fallback
            token.name = user.name || null;
            token.image = user.image || null;
          }
        } else {
          // Credentials login (user object from authorize return)
          token.id = user.id;
          token.name = user.name || null;
          token.image = user.image || null;
          // role might be missing if not added in authorize return, but we can fetch or assume it's there if authorize returned it.
          // Let's ensure authorize returns role if needed, or we fetch it here.
          // For optimization, let's assume authorize returns it or we fetch if crucial.
          // Actually, `user` in jwt callback is what `authorize` returned.
          // Fix: authorize doesn't return role in my simplified code above. I should add it.

          // If I cast user to any to access role
          if (user.role) {
            token.role = user.role;
          }
        }

        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
        // session.accessToken // We are dropping accessToken for Bearer flows, relying on cookie.
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
});
