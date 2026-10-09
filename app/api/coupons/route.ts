import { NextRequest, NextResponse } from "next/server";
import { auth, isAdminRole } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { couponSchema } from "@/lib/validation/coupon";

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
  const parsed = couponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }
  const d = parsed.data;
  try {
    const coupon = await prisma.coupon.create({
      data: {
        code: d.code,
        type: d.type,
        value: d.value,
        minOrderAmount: d.minOrderAmount,
        maxDiscount: d.maxDiscount,
        usageLimit: d.usageLimit,
        perCustomerLimit: d.perCustomerLimit,
        startsAt: d.startsAt ? new Date(d.startsAt) : null,
        endsAt: d.endsAt ? new Date(d.endsAt) : null,
        isActive: d.isActive,
        eligibleProductIds: d.eligibleProductIds,
        eligibleCategoryIds: d.eligibleCategoryIds,
      },
    });
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "COUPON_CREATED",
        entityType: "Coupon",
        entityId: coupon.id,
        metadata: { code: coupon.code },
      },
    });
    return NextResponse.json({ success: true, coupon }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed";
    if (msg.includes("Unique")) {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
