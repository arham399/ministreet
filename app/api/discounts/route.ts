import { NextRequest, NextResponse } from "next/server";
import { auth, isAdminRole } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { discountSchema } from "@/lib/validation/coupon";

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const discounts = await prisma.discount.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ discounts });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const parsed = discountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }
  const d = parsed.data;
  const discount = await prisma.discount.create({
    data: {
      name: d.name,
      type: d.type,
      value: d.value,
      scope: d.scope,
      minOrderAmount: d.minOrderAmount,
      maxDiscount: d.maxDiscount,
      startsAt: d.startsAt ? new Date(d.startsAt) : null,
      endsAt: d.endsAt ? new Date(d.endsAt) : null,
      isActive: d.isActive,
      usageLimit: d.usageLimit,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "DISCOUNT_CREATED",
      entityType: "Discount",
      entityId: discount.id,
    },
  });
  return NextResponse.json({ success: true, discount }, { status: 201 });
}
