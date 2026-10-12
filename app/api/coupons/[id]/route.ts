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
  const [products, categories] = await Promise.all([
    d.eligibleProductIds?.length
      ? prisma.product.findMany({
          where: {
            id: { in: d.eligibleProductIds },
            isActive: true,
            archivedAt: null,
          },
          select: { id: true },
        })
      : Promise.resolve([]),
    d.eligibleCategoryIds?.length
      ? prisma.category.findMany({
          where: { id: { in: d.eligibleCategoryIds }, isActive: true },
          select: { id: true },
        })
      : Promise.resolve([]),
  ]);
  if (d.eligibleProductIds && products.length !== d.eligibleProductIds.length) {
    return NextResponse.json({ error: "One or more selected products are unavailable." }, { status: 400 });
  }
  if (d.eligibleCategoryIds && categories.length !== d.eligibleCategoryIds.length) {
    return NextResponse.json({ error: "One or more selected categories are unavailable." }, { status: 400 });
  }

  const coupon = await prisma.coupon.update({
    where: { id },
    data: {
      ...(d.code && { code: d.code }),
      ...(d.type && { type: d.type }),
      ...(d.value != null && { value: d.value }),
      ...(d.minOrderAmount !== undefined && { minOrderAmount: d.minOrderAmount }),
      ...(d.maxDiscount !== undefined && { maxDiscount: d.maxDiscount }),
      ...(d.usageLimit !== undefined && { usageLimit: d.usageLimit }),
      ...(d.perCustomerLimit !== undefined && { perCustomerLimit: d.perCustomerLimit }),
      ...(d.eligibleProductIds !== undefined && { eligibleProductIds: d.eligibleProductIds }),
      ...(d.eligibleCategoryIds !== undefined && { eligibleCategoryIds: d.eligibleCategoryIds }),
      ...(d.isActive != null && { isActive: d.isActive }),
      ...(d.startsAt !== undefined && { startsAt: d.startsAt ? new Date(d.startsAt) : null }),
      ...(d.endsAt !== undefined && { endsAt: d.endsAt ? new Date(d.endsAt) : null }),
    },
  });
  return NextResponse.json({ success: true, coupon });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const session = await auth();
    if (!session?.user || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await ctx.params;
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "COUPON_DELETED",
          entityType: "Coupon",
          entityId: coupon.id,
          metadata: { code: coupon.code, usageCount: coupon.usageCount },
        },
      }),
      prisma.coupon.delete({ where: { id } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/coupons/:id]", error);
    return NextResponse.json({ error: "Unable to delete coupon." }, { status: 500 });
  }
}
