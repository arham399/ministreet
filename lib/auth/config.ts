import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { AdapterUser } from "next-auth/adapters";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import type { Role } from "@/lib/auth/permissions";
import { eq } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import {
  account,
  session,
  user,
  verificationToken,
} from "@/lib/db/drizzle/schema";

function createDrizzleAuthAdapter() {
  const { db } = getDrizzleClient();
  const adapter = DrizzleAdapter(db, {
    usersTable: user,
    accountsTable: account as never,
    // Auth.js models these as primary keys; the existing schema enforces the same fields as unique indexes.
    sessionsTable: session as never,
    verificationTokensTable: verificationToken as never,
  });

  return {
    ...adapter,
    async createUser(data: AdapterUser) {
      const [created] = await db
        .insert(user)
        .values({ ...data, updatedAt: new Date() })
        .returning();
      return created;
    },
    async updateUser(data: Partial<AdapterUser> & Pick<AdapterUser, "id">) {
      if (!data.id) throw new Error("Cannot update an Auth.js user without an ID.");
      const { id, ...updates } = data;
      const [updated] = await db
        .update(user)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(user.id, id))
        .returning();
      if (!updated) throw new Error(`Auth.js user ${id} was not found.`);
      return updated;
    },
  };
}

declare module "next-auth" {
  interface User {
    role?: Role;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: createDrizzleAuthAdapter() as never,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).toLowerCase().trim();
        const [userRecord] = await getDrizzleClient()
          .db.select().from(user)
          .where(eq(user.email, email))
          .limit(1);
        if (!userRecord || !userRecord.passwordHash || !userRecord.isActive) return null;
        const valid = await bcrypt.compare(
          String(credentials.password),
          userRecord.passwordHash
        );
        if (!valid) return null;
        return {
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.name,
          role: userRecord.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
});

export const ADMIN_ROLES: Role[] = [
  "OWNER",
  "ADMIN",
  "ORDER_MANAGER",
  "INVENTORY_MANAGER",
  "SUPPORT",
];

export function isAdminRole(role?: Role | null): boolean {
  return !!role && ADMIN_ROLES.includes(role);
}
