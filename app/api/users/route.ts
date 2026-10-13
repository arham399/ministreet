import { NextRequest, NextResponse } from "next/server";
import { desc, eq, ne } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth/config";
import { can } from "@/lib/auth/permissions";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { auditLog, user } from "@/lib/db/drizzle/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "users:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { db } = getDrizzleClient();
  const users = await db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  }).from(user).where(ne(user.role, "CUSTOMER")).orderBy(desc(user.createdAt));
  return NextResponse.json({ users });
}

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "ORDER_MANAGER", "INVENTORY_MANAGER", "SUPPORT"]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "users:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();
  const { db } = getDrizzleClient();
  const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (existing) {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const [createdUser] = await db.insert(user).values({
    id: globalThis.crypto.randomUUID(),
    updatedAt: new Date(),
    email,
    name: parsed.data.name,
    passwordHash,
    role: parsed.data.role,
  }).returning();
  if (!createdUser) throw new Error("Failed to create user");
  await db.insert(auditLog).values({
    id: globalThis.crypto.randomUUID(),
    actorId: session.user.id,
    action: "USER_CREATED",
    entityType: "User",
    entityId: createdUser.id,
    metadata: { role: createdUser.role, email: createdUser.email },
  });
  return NextResponse.json({
    success: true,
    user: { id: createdUser.id, email: createdUser.email, role: createdUser.role },
  });
}
