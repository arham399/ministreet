import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { auth, isAdminRole } from "@/lib/auth/config";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { auditLog, category, categoryToDiscount, discount, discountProduct, product } from "@/lib/db/drizzle/schema";
import { discountSchema } from "@/lib/validation/coupon";

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { db } = getDrizzleClient();
  const discounts = await db.select().from(discount).orderBy(desc(discount.createdAt));
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
  const { db } = getDrizzleClient();
  if (d.scope === "PRODUCT") {
    const rows = await db.select({ id: product.id }).from(product).where(and(
      inArray(product.id, d.eligibleProductIds),
      eq(product.isActive, true),
      isNull(product.archivedAt),
    ));
    if (rows.length !== d.eligibleProductIds.length) {
      return NextResponse.json({ error: "One or more selected products are unavailable." }, { status: 400 });
    }
  }
  if (d.scope === "CATEGORY") {
    const rows = await db.select({ id: category.id }).from(category).where(and(
      inArray(category.id, d.eligibleCategoryIds),
      eq(category.isActive, true),
    ));
    if (rows.length !== d.eligibleCategoryIds.length) {
      return NextResponse.json({ error: "One or more selected categories are unavailable." }, { status: 400 });
    }
  }
  const createdDiscount = await db.transaction(async (tx) => {
    const [savedDiscount] = await tx.insert(discount).values({
      id: globalThis.crypto.randomUUID(),
      updatedAt: new Date(),
      name: d.name,
      type: d.type,
      value: String(d.value),
      scope: d.scope,
      minOrderAmount: d.minOrderAmount == null ? null : String(d.minOrderAmount),
      maxDiscount: d.maxDiscount == null ? null : String(d.maxDiscount),
      startsAt: d.startsAt ? new Date(d.startsAt) : null,
      endsAt: d.endsAt ? new Date(d.endsAt) : null,
      isActive: d.isActive,
      usageLimit: d.usageLimit,
    }).returning();
    if (!savedDiscount) throw new Error("Failed to create discount");
    if (d.scope === "PRODUCT" && d.eligibleProductIds.length) {
      await tx.insert(discountProduct).values(d.eligibleProductIds.map((productId) => ({
        discountId: savedDiscount.id,
        productId,
      })));
    }
    if (d.scope === "CATEGORY" && d.eligibleCategoryIds.length) {
      await tx.insert(categoryToDiscount).values(d.eligibleCategoryIds.map((categoryId) => ({
        a: categoryId,
        b: savedDiscount.id,
      })));
    }
    await tx.insert(auditLog).values({
      id: globalThis.crypto.randomUUID(),
      actorId: session.user.id,
      action: "DISCOUNT_CREATED",
      entityType: "Discount",
      entityId: savedDiscount.id,
    });
    return savedDiscount;
  });
  return NextResponse.json({ success: true, discount: createdDiscount }, { status: 201 });
}
