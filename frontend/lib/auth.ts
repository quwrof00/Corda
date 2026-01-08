import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import { api } from "@/lib/api"; // axios instance

export const getAuthOptions = (): NextAuthOptions => ({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Missing email or password");
        }

        try {
          // hit your backend route instead of prisma
          const { data } = await api.post("/auth/login", {
            email: credentials.email,
            password: credentials.password,
          });

          if (!data || !data.user || !data.token) throw new Error("Invalid login");

          return { ...data.user, accessToken: data.token };

        } catch (error: unknown) {
          console.error("Auth error:", error);
          // @ts-expect-error: error type is unknown but we expect axios response
          throw new Error(error.response?.data?.message || "Login failed");
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
      // Create valid backend session for Google users
      if (account && user) {
        if (account.provider === "google") {
          try {
            const { data } = await api.post("/auth/google", {
              email: user.email,
              name: user.name,
              image: user.image,
              googleId: account.providerAccountId,
            });

            token.id = data.user.id;
            token.accessToken = data.token;
            token.role = data.user.role;

            // USE BACKEND NAME/IMAGE (Source of Truth)
            token.name = data.user.name;
            token.image = data.user.image;

          } catch (error) {
            console.error("Google Auth Sync Error:", error);
            // Fallback to Google data if backend fails
            token.name = user.name;
            token.image = user.image;
          }
        } else {
          // Credentials login
          token.id = user.id;
          token.accessToken = user.accessToken;
          token.name = user.name;
          token.image = user.image;
        }

        // Always sync email
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
        session.accessToken = token.accessToken as string;
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
