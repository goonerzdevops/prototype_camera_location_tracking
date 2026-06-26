import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.username,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    // Izinkan redirect ke IP lokal manapun — fix untuk multi-IP setup tanpa NEXTAUTH_URL
    // Tanpa ini, NextAuth fallback ke baseUrl = localhost:3000 dan override callbackUrl dari mobile
    async redirect({ url, baseUrl }) {
      // Relative URL → gunakan apa adanya
      if (url.startsWith("/")) return url;

      try {
        const { hostname, port } = new URL(url);
        // Izinkan localhost
        if (hostname === "localhost") return url;
        // Izinkan semua private IP range (10.x, 192.168.x, 172.16-31.x)
        if (
          /^10\./.test(hostname) ||
          /^192\.168\./.test(hostname) ||
          /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
        ) {
          return url;
        }
      } catch {
        // URL tidak valid, fallback ke baseUrl
      }

      return baseUrl;
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "supersecretkey123",
};
