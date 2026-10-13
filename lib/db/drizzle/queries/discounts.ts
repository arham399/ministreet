import { and, eq, gte, isNull, lte, or } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import {
  category,
  categoryToDiscount,
  discount,
  discountProduct,
} from "@/lib/db/drizzle/schema";

export async function getActiveAutomaticDiscountsWithDrizzle() {
  const { db } = getDrizzleClient();
  const now = new Date();
  const activeWhere = and(
    eq(discount.isActive, true),
    or(isNull(discount.startsAt), lte(discount.startsAt, now)),
    or(isNull(discount.endsAt), gte(discount.endsAt, now)),
  );

  const [discountRows, products, categoryRows] = await Promise.all([
    db.select().from(discount).where(activeWhere),
    db
      .select({ discountId: discountProduct.discountId, productId: discountProduct.productId })
      .from(discountProduct),
    db
      .select({
      discountId: categoryToDiscount.b,
      id: category.id,
    })
    .from(categoryToDiscount)
      .innerJoin(category, eq(category.id, categoryToDiscount.a)),
  ]);

  return discountRows.map((row) => ({
    ...row,
    value: Number(row.value),
    minOrderAmount: row.minOrderAmount == null ? null : Number(row.minOrderAmount),
    maxDiscount: row.maxDiscount == null ? null : Number(row.maxDiscount),
    products: products
      .filter((productRow) => productRow.discountId === row.id)
      .map((productRow) => ({ productId: productRow.productId })),
    categories: categoryRows
      .filter((categoryRow) => categoryRow.discountId === row.id)
      .map((categoryRow) => ({ id: categoryRow.id })),
  }));
}
