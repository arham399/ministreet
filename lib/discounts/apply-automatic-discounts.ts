export type AutomaticDiscountRule = {
  id: string;
  name: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number | { toString(): string };
  scope: string;
  minOrderAmount: number | { toString(): string } | null;
  maxDiscount: number | { toString(): string } | null;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  usageLimit: number | null;
  usageCount: number;
  products: { productId: string }[];
  categories: { id: string }[];
};

export type DiscountableProduct = {
  id: string;
  price: number | { toString(): string };
  salePrice: number | { toString(): string } | null;
  categoryId: string | null;
};

export type AutomaticPrice = {
  unitPrice: number;
  originalPrice: number;
  discountId: string | null;
  discountName: string | null;
  discountAmount: number;
};

export function applyAutomaticDiscounts(
  products: DiscountableProduct[],
  rules: AutomaticDiscountRule[],
  cartSubtotal = 0,
  now = new Date(),
): Map<string, AutomaticPrice> {
  const prices = new Map<string, AutomaticPrice>();

  for (const product of products) {
    const originalPrice = Number(product.price);
    const existingSalePrice =
      product.salePrice != null && Number(product.salePrice) < originalPrice
        ? Number(product.salePrice)
        : originalPrice;
    let bestPrice = existingSalePrice;
    let bestDiscountId: string | null = null;
    let bestDiscountName: string | null = null;

    for (const rule of rules) {
      if (!rule.isActive || (rule.startsAt && rule.startsAt > now) || (rule.endsAt && rule.endsAt < now)) {
        continue;
      }
      if (rule.usageLimit != null && rule.usageCount >= rule.usageLimit) continue;
      if (rule.minOrderAmount != null && cartSubtotal < Number(rule.minOrderAmount)) continue;

      const eligible =
        rule.scope === "STOREWIDE" ||
        (rule.scope === "PRODUCT" && rule.products.some((item) => item.productId === product.id)) ||
        (rule.scope === "CATEGORY" &&
          product.categoryId != null &&
          rule.categories.some((category) => category.id === product.categoryId));
      if (!eligible) continue;

      const rawDiscount =
        rule.type === "PERCENTAGE"
          ? (originalPrice * Number(rule.value)) / 100
          : Number(rule.value);
      const discount = Math.min(
        rawDiscount,
        rule.maxDiscount == null ? originalPrice : Number(rule.maxDiscount),
        originalPrice,
      );
      const candidatePrice = Math.round((originalPrice - discount) * 100) / 100;

      if (candidatePrice < bestPrice) {
        bestPrice = candidatePrice;
        bestDiscountId = rule.id;
        bestDiscountName = rule.name;
      }
    }

    prices.set(product.id, {
      unitPrice: bestPrice,
      originalPrice,
      discountId: bestDiscountId,
      discountName: bestDiscountName,
      discountAmount: Math.round((originalPrice - bestPrice) * 100) / 100,
    });
  }

  return prices;
}
