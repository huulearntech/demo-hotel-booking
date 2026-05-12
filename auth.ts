import bcrypt from 'bcrypt';
import prisma from "@/lib/prisma"
import Credentials from "next-auth/providers/credentials";
import { schemaSignIn } from "@/lib/zod_schemas/auth";
import { PATHS } from './lib/constants';

import { type NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";

export const nextAuthConfig = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email", placeholder: "example@example.com" },
        password: { label: "Password", type: "password", placeholder: "Your password" },
      },
      async authorize(credentials) {
        const parsedCredentials = schemaSignIn.safeParse(credentials);
        if (!parsedCredentials.success) return null;

        const { email, password } = parsedCredentials.data;
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
            status: true,
          },
        });
        if (!user) return null;
        

        // FIXME: Remove this on production
        const isDevelopment = process.env.NODE_ENV === "development";
        let passwordMatch = false;
        if (isDevelopment) passwordMatch = (password === user.password);
        else passwordMatch = await bcrypt.compare(
          password,
          user.password as string
        );

        if (!passwordMatch) return null;
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Handle updates coming from unstable_update / session.update in NextAuth v5
      if (trigger === "update" && session) {
        const { id, role, status } = session.user;
        if (id !== undefined) token.id = id;
        if (role !== undefined) token.role = role;
        if (status !== undefined) token.status = status;
        return token;
      }

      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.status = token.status;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Allow relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  pages: {
    signIn: PATHS.signIn,
  },
} satisfies NextAuthConfig;

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth(nextAuthConfig);