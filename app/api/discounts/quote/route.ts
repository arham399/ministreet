import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  applyAutomaticDiscounts,
} from "@/lib/discounts/apply-automatic-discounts";
import { getActiveAutomaticDiscounts } from "@/lib/discounts/queries";
import { calculateSubtotal } from "@/lib/pricing/calculate";

const quoteSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1).max(20),
  })).min(1).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = quoteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid cart items." }, { status: 400 });
    }

    const { items } = parsed.data;
    const productIds = [...new Set(items.map((item) => item.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true, archivedAt: null },
      select: { id: true, price: true, salePrice: true, categoryId: true },
    });
    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "One or more products in your cart are unavailable." }, { status: 400 });
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    const lines = items.map((item) => {
      const product = productMap.get(item.productId)!;
      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice: Number(product.price),
        salePrice: product.salePrice != null ? Number(product.salePrice) : null,
      };
    });
    const subtotalBeforeAutomaticDiscounts = calculateSubtotal(lines);
    const rules = await getActiveAutomaticDiscounts();
    const prices = applyAutomaticDiscounts(
      products,
      rules,
      subtotalBeforeAutomaticDiscounts,
    );

    const quotedItems = items.map((item) => {
      const price = prices.get(item.productId)!;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: price.unitPrice,
        originalPrice: price.originalPrice,
        discountName: price.discountName,
      };
    });
    const subtotal = quotedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    return NextResponse.json({
      items: quotedItems,
      subtotal: Math.round(subtotal * 100) / 100,
    });
  } catch (error) {
    console.error("[POST /api/discounts/quote]", error);
    return NextResponse.json({ error: "Unable to calculate your cart discounts." }, { status: 500 });
  }
}
