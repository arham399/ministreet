import { FREE_SHIPPING_THRESHOLD, DEFAULT_SHIPPING_COST } from "@/lib/constants";

export type CartLine = {
  productId: string;
  quantity: number;
  unitPrice: number; // from DB, never trust client
  salePrice?: number | null;
};

export type CouponResult = {
  code: string;
  discountAmount: number;
  valid: boolean;
  error?: string;
};

export function lineUnitPrice(line: CartLine): number {
  if (line.salePrice != null && line.salePrice < line.unitPrice) {
    return Number(line.salePrice);
  }
  return Number(line.unitPrice);
}

export function calculateSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + lineUnitPrice(line) * line.quantity, 0);
}

export function calculateShipping(
  subtotal: number,
  freeThreshold = FREE_SHIPPING_THRESHOLD,
  defaultCost = DEFAULT_SHIPPING_COST
): number {
  if (subtotal >= freeThreshold) return 0;
  return defaultCost;
}

export function calculateOrderTotals(params: {
  lines: CartLine[];
  couponDiscount?: number;
  shippingOverride?: number;
}) {
  const subtotal = calculateSubtotal(params.lines);
  const discountAmount = Math.min(params.couponDiscount ?? 0, subtotal);
  const afterDiscount = subtotal - discountAmount;
  const shippingAmount =
    params.shippingOverride ?? calculateShipping(afterDiscount);
  const total = Math.max(0, afterDiscount + shippingAmount);

  return {
    subtotal: round2(subtotal),
    discountAmount: round2(discountAmount),
    shippingAmount: round2(shippingAmount),
    total: round2(total),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
