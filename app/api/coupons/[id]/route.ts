import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { auth, isAdminRole } from "@/lib/auth/config";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { auditLog, category, coupon, product } from "@/lib/db/drizzle/schema";
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
  const { db } = getDrizzleClient();
  const [products, categories] = await Promise.all([
    d.eligibleProductIds?.length
      ? db.select({ id: product.id }).from(product).where(and(
          inArray(product.id, d.eligibleProductIds),
          eq(product.isActive, true),
          isNull(product.archivedAt),
        ))
      : Promise.resolve([]),
    d.eligibleCategoryIds?.length
      ? db.select({ id: category.id }).from(category).where(and(
          inArray(category.id, d.eligibleCategoryIds),
          eq(category.isActive, true),
        ))
      : Promise.resolve([]),
  ]);
  if (d.eligibleProductIds && products.length !== d.eligibleProductIds.length) {
    return NextResponse.json({ error: "One or more selected products are unavailable." }, { status: 400 });
  }
  if (d.eligibleCategoryIds && categories.length !== d.eligibleCategoryIds.length) {
    return NextResponse.json({ error: "One or more selected categories are unavailable." }, { status: 400 });
  }

  const update: Partial<typeof coupon.$inferInsert> = {};
  update.updatedAt = new Date();
  if (d.code) update.code = d.code;
  if (d.type) update.type = d.type;
  if (d.value != null) update.value = String(d.value);
  if (d.minOrderAmount !== undefined) update.minOrderAmount = d.minOrderAmount == null ? null : String(d.minOrderAmount);
  if (d.maxDiscount !== undefined) update.maxDiscount = d.maxDiscount == null ? null : String(d.maxDiscount);
  if (d.usageLimit !== undefined) update.usageLimit = d.usageLimit;
  if (d.perCustomerLimit !== undefined) update.perCustomerLimit = d.perCustomerLimit;
  if (d.eligibleProductIds !== undefined) update.eligibleProductIds = d.eligibleProductIds;
  if (d.eligibleCategoryIds !== undefined) update.eligibleCategoryIds = d.eligibleCategoryIds;
  if (d.isActive != null) update.isActive = d.isActive;
  if (d.startsAt !== undefined) update.startsAt = d.startsAt ? new Date(d.startsAt) : null;
  if (d.endsAt !== undefined) update.endsAt = d.endsAt ? new Date(d.endsAt) : null;
  const [savedCoupon] = await db.update(coupon).set(update).where(eq(coupon.id, id)).returning();
  if (!savedCoupon) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
  return NextResponse.json({ success: true, coupon: savedCoupon });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const session = await auth();
    if (!session?.user || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await ctx.params;
    const { db } = getDrizzleClient();
    const [existingCoupon] = await db.select().from(coupon).where(eq(coupon.id, id)).limit(1);
    if (!existingCoupon) {
      return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
    }

    await db.transaction(async (tx) => {
      await tx.insert(auditLog).values({
        id: globalThis.crypto.randomUUID(),
        actorId: session.user.id,
        action: "COUPON_DELETED",
        entityType: "Coupon",
        entityId: existingCoupon.id,
        metadata: { code: existingCoupon.code, usageCount: existingCoupon.usageCount },
      });
      await tx.delete(coupon).where(eq(coupon.id, id));
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/coupons/:id]", error);
    return NextResponse.json({ error: "Unable to delete coupon." }, { status: 500 });
  }
}
