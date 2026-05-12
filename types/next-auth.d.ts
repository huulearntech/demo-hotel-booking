import { UserRole, UserStatus } from '../lib/generated/prisma/enums';

import NextAuth, { type NextAuthConfig, type DefaultSession, type DefaultUser } from "next-auth";
declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    role: UserRole;
    status: UserStatus
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      status: UserStatus
    } & DefaultSession["user"];
  }
}

import { DefaultJWT } from "next-auth/jwt";
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
    status: UserStatus
  }
}
