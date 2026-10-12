import { NextRequest, NextResponse } from "next/server";
import { auth, isAdminRole } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { couponSchema } from "@/lib/validation/coupon";
import { randomUUID } from "node:crypto";

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ coupons });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const replaceExisting = body?.replaceExisting === true;
  const parsed = couponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }
  const d = parsed.data;
  try {
    const [products, categories] = await Promise.all([
      d.eligibleProductIds.length
        ? prisma.product.findMany({
            where: {
              id: { in: d.eligibleProductIds },
              isActive: true,
              archivedAt: null,
            },
            select: { id: true },
          })
        : Promise.resolve([]),
      d.eligibleCategoryIds.length
        ? prisma.category.findMany({
            where: { id: { in: d.eligibleCategoryIds }, isActive: true },
            select: { id: true },
          })
        : Promise.resolve([]),
    ]);
    if (products.length !== d.eligibleProductIds.length) {
      return NextResponse.json({ error: "One or more selected products are unavailable." }, { status: 400 });
    }
    if (categories.length !== d.eligibleCategoryIds.length) {
      return NextResponse.json({ error: "One or more selected categories are unavailable." }, { status: 400 });
    }

    const existing = await prisma.coupon.findUnique({ where: { code: d.code } });
    if (existing && !replaceExisting) {
      return NextResponse.json(
        { code: "COUPON_EXISTS", error: "A coupon with this code already exists." },
        { status: 409 },
      );
    }
    if (!existing && replaceExisting) {
      return NextResponse.json(
        { error: "This coupon no longer exists. Refresh the page and create it again." },
        { status: 409 },
      );
    }

    const campaignId = randomUUID();
    const couponData = {
      type: d.type,
      value: d.value,
      minOrderAmount: d.minOrderAmount,
      maxDiscount: d.maxDiscount,
      usageLimit: d.usageLimit,
      usageCount: 0,
      perCustomerLimit: d.perCustomerLimit,
      startsAt: d.startsAt ? new Date(d.startsAt) : null,
      endsAt: d.endsAt ? new Date(d.endsAt) : null,
      isActive: d.isActive,
      eligibleProductIds: d.eligibleProductIds,
      eligibleCategoryIds: d.eligibleCategoryIds,
    };
    const coupon = await prisma.$transaction(async (tx) => {
      const savedCoupon = existing
        ? await tx.coupon.update({
            where: { id: existing.id },
            data: { ...couponData, campaignId },
          })
        : await tx.coupon.create({
            data: { ...couponData, code: d.code, campaignId },
          });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: existing ? "COUPON_RECREATED" : "COUPON_CREATED",
          entityType: "Coupon",
          entityId: savedCoupon.id,
          metadata: {
            code: savedCoupon.code,
            previousCampaignId: existing?.campaignId ?? null,
            campaignId,
          },
        },
      });
      return savedCoupon;
    });
    return NextResponse.json({ success: true, coupon }, { status: existing ? 200 : 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed";
    if (msg.includes("Unique")) {
      return NextResponse.json(
        { code: "COUPON_EXISTS", error: "A coupon with this code already exists." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
