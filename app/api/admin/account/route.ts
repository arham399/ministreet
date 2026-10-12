import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth/config";
import { can } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, passwordHash: true, isActive: true, role: true },
    });
    if (!user || !user.isActive || !can(user.role, "settings:write")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (!user.passwordHash || !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const emailChanged = email !== user.email;
    const passwordChanged = Boolean(parsed.data.newPassword);
    if (!emailChanged && !passwordChanged) {
      return NextResponse.json({ error: "Enter a new email or password" }, { status: 400 });
    }

    if (emailChanged) {
      const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (existing) {
        return NextResponse.json({ error: "That email is already in use" }, { status: 409 });
      }
    }

    const data: { email?: string; passwordHash?: string } = {};
    if (emailChanged) data.email = email;
    if (parsed.data.newPassword) {
      data.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data }),
      prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "ADMIN_CREDENTIALS_UPDATED",
          entityType: "User",
          entityId: user.id,
          metadata: { emailChanged, passwordChanged },
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "That email is already in use" }, { status: 409 });
    }
    console.error("[admin-account-update]", error);
    return NextResponse.json({ error: "Could not update account credentials" }, { status: 500 });
  }
}
