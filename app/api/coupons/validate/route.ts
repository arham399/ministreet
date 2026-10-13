import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { coupon as couponsTable, order, product } from "@/lib/db/drizzle/schema";
import { checkoutSchema } from "@/lib/validation/checkout";
import { validateCouponForCart } from "@/lib/coupons/validate-coupon";
import { z } from "zod";
import { applyAutomaticDiscounts } from "@/lib/discounts/apply-automatic-discounts";
import { getActiveAutomaticDiscountsWithDrizzle } from "@/lib/db/drizzle/queries/discounts";
import { calculateSubtotal } from "@/lib/pricing/calculate";

const couponValidationSchema = z.object({
  code: z.string().trim().min(1, "Enter a coupon code.").max(30),
  customerEmail: z.string().max(254).optional(),
  items: checkoutSchema.shape.items,
});

export async function POST(req: NextRequest) {
  try {
    const parsed = couponValidationSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { valid: false, error: parsed.error.errors[0]?.message || "Invalid coupon request." },
        { status: 400 },
      );
    }
    const request = parsed.data;

    const { db } = getDrizzleClient();
    const [coupon] = await db.select().from(couponsTable)
      .where(eq(couponsTable.code, request.code.toUpperCase())).limit(1);
    if (!coupon) {
      return NextResponse.json({ valid: false, error: "Invalid coupon code." });
    }

    const products = await db.select({
      id: product.id,
      price: product.price,
      salePrice: product.salePrice,
      categoryId: product.categoryId,
    }).from(product).where(and(
      inArray(product.id, request.items.map((item) => item.productId)),
      eq(product.isActive, true),
      isNull(product.archivedAt),
    ));
    if (products.length !== new Set(request.items.map((item) => item.productId)).size) {
      return NextResponse.json({ valid: false, error: "One or more cart items are unavailable." });
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    const baseLines = request.items.map((item) => {
      const product = productMap.get(item.productId)!;
      return {
        productId: product.id,
        categoryId: product.categoryId,
        quantity: item.quantity,
        unitPrice: Number(product.price),
        salePrice: product.salePrice != null ? Number(product.salePrice) : null,
      };
    });
    const automaticPrices = applyAutomaticDiscounts(
      products,
      await getActiveAutomaticDiscountsWithDrizzle(),
      calculateSubtotal(baseLines),
    );
    const lines = baseLines.map((line) => ({
      ...line,
      salePrice: automaticPrices.get(line.productId)!.unitPrice,
    }));

    const customerEmail = request.customerEmail?.trim() || "";
    let customerUsageCount = 0;
    if (coupon.perCustomerLimit != null && !customerEmail) {
      return NextResponse.json({
        valid: false,
        error: "Enter your email before applying this coupon so we can check its per-customer limit.",
      });
    }
    if (coupon.perCustomerLimit != null) {
      const priorCouponOrders = await db.select({ customerEmail: order.customerEmail }).from(order)
        .where(and(
          eq(order.couponCode, coupon.code),
          coupon.campaignId === "legacy"
            ? or(eq(order.couponCampaignId, "legacy"), isNull(order.couponCampaignId))
            : eq(order.couponCampaignId, coupon.campaignId),
        ));
      customerUsageCount = priorCouponOrders.filter(
        (order) => order.customerEmail.toLowerCase() === customerEmail.toLowerCase(),
      ).length;
    }

    const result = validateCouponForCart(coupon, lines, customerUsageCount);
    if (!result.valid) return NextResponse.json(result);

    return NextResponse.json({
      valid: true,
      code: result.code,
      discountAmount: result.discountAmount,
    });
  } catch (error) {
    console.error("[POST /api/coupons/validate]", error);
    return NextResponse.json({ valid: false, error: "Validation failed" }, { status: 500 });
  }
}
