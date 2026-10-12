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
  if (d.scope === "PRODUCT") {
    const count = await prisma.product.count({
      where: { id: { in: d.eligibleProductIds }, isActive: true, archivedAt: null },
    });
    if (count !== d.eligibleProductIds.length) {
      return NextResponse.json({ error: "One or more selected products are unavailable." }, { status: 400 });
    }
  }
  if (d.scope === "CATEGORY") {
    const count = await prisma.category.count({
      where: { id: { in: d.eligibleCategoryIds }, isActive: true },
    });
    if (count !== d.eligibleCategoryIds.length) {
      return NextResponse.json({ error: "One or more selected categories are unavailable." }, { status: 400 });
    }
  }
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
      products:
        d.scope === "PRODUCT"
          ? { create: d.eligibleProductIds.map((productId) => ({ productId })) }
          : undefined,
      categories:
        d.scope === "CATEGORY"
          ? { connect: d.eligibleCategoryIds.map((id) => ({ id })) }
          : undefined,
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
