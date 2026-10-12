import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkoutSchema } from "@/lib/validation/checkout";
import { validateCouponForCart } from "@/lib/coupons/validate-coupon";
import { z } from "zod";
import { applyAutomaticDiscounts } from "@/lib/discounts/apply-automatic-discounts";
import { getActiveAutomaticDiscounts } from "@/lib/discounts/queries";
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

    const coupon = await prisma.coupon.findUnique({
      where: { code: request.code.toUpperCase() },
    });
    if (!coupon) {
      return NextResponse.json({ valid: false, error: "Invalid coupon code." });
    }

    const products = await prisma.product.findMany({
      where: {
        id: { in: request.items.map((item) => item.productId) },
        isActive: true,
        archivedAt: null,
      },
      select: { id: true, price: true, salePrice: true, categoryId: true },
    });
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
      await getActiveAutomaticDiscounts(),
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
      const priorCouponOrders = await prisma.order.findMany({
        where: {
          couponCode: coupon.code,
          ...(coupon.campaignId === "legacy"
            ? { OR: [{ couponCampaignId: "legacy" }, { couponCampaignId: null }] }
            : { couponCampaignId: coupon.campaignId }),
        },
        select: { customerEmail: true },
      });
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
