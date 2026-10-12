import type { Coupon } from "@prisma/client";
import { calculateSubtotal, lineUnitPrice, type CartLine } from "@/lib/pricing/calculate";

export type CouponCartLine = CartLine & {
  categoryId: string | null;
};

export type CouponValidationResult =
  | { valid: true; code: string; discountAmount: number }
  | { valid: false; error: string };

function toStringSet(value: Coupon["eligibleProductIds"] | Coupon["eligibleCategoryIds"]) {
  if (!Array.isArray(value)) return new Set<string>();
  return new Set(value.filter((entry): entry is string => typeof entry === "string"));
}

export function validateCouponForCart(
  coupon: Coupon,
  lines: CouponCartLine[],
  customerUsageCount = 0,
): CouponValidationResult {
  if (!coupon.isActive) {
    return { valid: false, error: "This coupon is inactive." };
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { valid: false, error: "This coupon is not active yet." };
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    return { valid: false, error: "This coupon has expired." };
  }
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
    return { valid: false, error: "This coupon has reached its usage limit." };
  }
  if (coupon.perCustomerLimit != null && customerUsageCount >= coupon.perCustomerLimit) {
    return { valid: false, error: "You have reached the usage limit for this coupon." };
  }

  const subtotal = calculateSubtotal(lines);
  if (coupon.minOrderAmount != null && subtotal < Number(coupon.minOrderAmount)) {
    return {
      valid: false,
      error: `Minimum order of Rs. ${Number(coupon.minOrderAmount).toLocaleString("en-PK")} required for this coupon.`,
    };
  }

  const eligibleProductIds = toStringSet(coupon.eligibleProductIds);
  const eligibleCategoryIds = toStringSet(coupon.eligibleCategoryIds);
  const hasEligibilityRules = eligibleProductIds.size > 0 || eligibleCategoryIds.size > 0;
  const eligibleSubtotal = hasEligibilityRules
    ? lines.reduce((sum, line) => {
        const eligible =
          eligibleProductIds.has(line.productId) ||
          (line.categoryId != null && eligibleCategoryIds.has(line.categoryId));
        return sum + (eligible ? lineUnitPrice(line) * line.quantity : 0);
      }, 0)
    : subtotal;

  if (eligibleSubtotal <= 0) {
    return { valid: false, error: "This coupon does not apply to the items in your cart." };
  }

  let discountAmount =
    coupon.type === "PERCENTAGE"
      ? (eligibleSubtotal * Number(coupon.value)) / 100
      : Number(coupon.value);
  if (coupon.type === "PERCENTAGE" && coupon.maxDiscount != null) {
    discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
  }

  discountAmount = Math.round(Math.min(discountAmount, eligibleSubtotal) * 100) / 100;
  if (discountAmount <= 0) {
    return { valid: false, error: "This coupon does not provide a discount for this order." };
  }

  return { valid: true, code: coupon.code, discountAmount };
}
