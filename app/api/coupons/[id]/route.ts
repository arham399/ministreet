import { NextRequest, NextResponse } from "next/server";
import { auth, isAdminRole } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { couponSchema } from "@/lib/validation/coupon";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = couponSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }
  const d = parsed.data;
  const coupon = await prisma.coupon.update({
    where: { id },
    data: {
      ...(d.code && { code: d.code }),
      ...(d.type && { type: d.type }),
      ...(d.value != null && { value: d.value }),
      ...(d.minOrderAmount !== undefined && { minOrderAmount: d.minOrderAmount }),
      ...(d.maxDiscount !== undefined && { maxDiscount: d.maxDiscount }),
      ...(d.usageLimit !== undefined && { usageLimit: d.usageLimit }),
      ...(d.isActive != null && { isActive: d.isActive }),
      ...(d.startsAt !== undefined && { startsAt: d.startsAt ? new Date(d.startsAt) : null }),
      ...(d.endsAt !== undefined && { endsAt: d.endsAt ? new Date(d.endsAt) : null }),
    },
  });
  return NextResponse.json({ success: true, coupon });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await prisma.coupon.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
