import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth/config";
import { can } from "@/lib/auth/permissions";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { auditLog, user } from "@/lib/db/drizzle/schema";

const accountEmailSchema = z.string().trim().max(254).refine((value) => {
  const [localPart, domain, ...extra] = value.split("@");
  if (
    !localPart ||
    localPart.length > 64 ||
    !domain ||
    domain.length > 253 ||
    extra.length > 0 ||
    !/^[A-Z0-9!#$%&'*+/=?^_`{|}~.-]+$/i.test(localPart) ||
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    localPart.includes("..")
  ) {
    return false;
  }

  return domain.split(".").every((label) =>
    label.length <= 63 &&
    /^[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?$/i.test(label)
  );
}, "Enter a valid email address");

const schema = z.object({
  currentPassword: z.string().min(1).max(100),
  email: accountEmailSchema,
  newPassword: z.string().min(8).max(100).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid account details" },
        { status: 400 }
      );
    }

    const { db } = getDrizzleClient();
    const [accountUser] = await db.select({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      isActive: user.isActive,
      role: user.role,
    }).from(user).where(eq(user.id, session.user.id)).limit(1);
    if (!accountUser || !accountUser.isActive || !can(accountUser.role, "settings:write")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (!accountUser.passwordHash || !(await bcrypt.compare(parsed.data.currentPassword, accountUser.passwordHash))) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const emailChanged = email !== accountUser.email;
    const passwordChanged = Boolean(parsed.data.newPassword);
    if (!emailChanged && !passwordChanged) {
      return NextResponse.json({ error: "Enter a new email or password" }, { status: 400 });
    }

    if (emailChanged) {
      const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
      if (existing) {
        return NextResponse.json({ error: "That email is already in use" }, { status: 409 });
      }
    }

    const data: Partial<typeof user.$inferInsert> = {};
    data.updatedAt = new Date();
    if (emailChanged) data.email = email;
    if (parsed.data.newPassword) {
      data.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    }

    await db.transaction(async (tx) => {
      await tx.update(user).set(data).where(eq(user.id, accountUser.id));
      await tx.insert(auditLog).values({
        id: globalThis.crypto.randomUUID(),
        actorId: accountUser.id,
        action: "ADMIN_CREDENTIALS_UPDATED",
        entityType: "User",
        entityId: accountUser.id,
        metadata: { emailChanged, passwordChanged },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return NextResponse.json({ error: "That email is already in use" }, { status: 409 });
    }
    console.error("[admin-account-update]", error);
    return NextResponse.json({ error: "Could not update account credentials" }, { status: 500 });
  }
}
