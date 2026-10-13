import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { auth, isAdminRole } from "@/lib/auth/config";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { auditLog, category, coupon, product } from "@/lib/db/drizzle/schema";
import { couponSchema } from "@/lib/validation/coupon";
import { randomUUID } from "node:crypto";

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { db } = getDrizzleClient();
  const coupons = await db.select().from(coupon).orderBy(desc(coupon.createdAt));
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
    const { db } = getDrizzleClient();
    const [products, categories] = await Promise.all([
      d.eligibleProductIds.length
        ? db.select({ id: product.id }).from(product).where(and(
            inArray(product.id, d.eligibleProductIds),
            eq(product.isActive, true),
            isNull(product.archivedAt),
          ))
        : Promise.resolve([]),
      d.eligibleCategoryIds.length
        ? db.select({ id: category.id }).from(category).where(and(
            inArray(category.id, d.eligibleCategoryIds),
            eq(category.isActive, true),
          ))
        : Promise.resolve([]),
    ]);
    if (products.length !== d.eligibleProductIds.length) {
      return NextResponse.json({ error: "One or more selected products are unavailable." }, { status: 400 });
    }
    if (categories.length !== d.eligibleCategoryIds.length) {
      return NextResponse.json({ error: "One or more selected categories are unavailable." }, { status: 400 });
    }

    const [existing] = await db.select().from(coupon).where(eq(coupon.code, d.code)).limit(1);
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
      updatedAt: new Date(),
      type: d.type,
      value: String(d.value),
      minOrderAmount: d.minOrderAmount == null ? null : String(d.minOrderAmount),
      maxDiscount: d.maxDiscount == null ? null : String(d.maxDiscount),
      usageLimit: d.usageLimit,
      usageCount: 0,
      perCustomerLimit: d.perCustomerLimit,
      startsAt: d.startsAt ? new Date(d.startsAt) : null,
      endsAt: d.endsAt ? new Date(d.endsAt) : null,
      isActive: d.isActive,
      eligibleProductIds: d.eligibleProductIds,
      eligibleCategoryIds: d.eligibleCategoryIds,
    };
    const savedCoupon = await db.transaction(async (tx) => {
      const [saved] = existing
        ? await tx.update(coupon).set({ ...couponData, campaignId })
          .where(eq(coupon.id, existing.id)).returning()
        : await tx.insert(coupon).values({
            ...couponData,
            id: globalThis.crypto.randomUUID(),
            code: d.code,
            campaignId,
          }).returning();
      if (!saved) throw new Error("Failed to save coupon");
      await tx.insert(auditLog).values({
          id: globalThis.crypto.randomUUID(),
          actorId: session.user.id,
          action: existing ? "COUPON_RECREATED" : "COUPON_CREATED",
          entityType: "Coupon",
          entityId: saved.id,
          metadata: {
            code: saved.code,
            previousCampaignId: existing?.campaignId ?? null,
            campaignId,
          },
      });
      return saved;
    });
    return NextResponse.json(
      { success: true, coupon: savedCoupon },
      { status: existing ? 200 : 201 },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed";
    if (msg.includes("Unique") || (err && typeof err === "object" && "code" in err && err.code === "23505")) {
      return NextResponse.json(
        { code: "COUPON_EXISTS", error: "A coupon with this code already exists." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
