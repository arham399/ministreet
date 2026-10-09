import { describe, it, expect } from "vitest";
import { calculateOrderTotals, calculateSubtotal, calculateShipping } from "@/lib/pricing/calculate";

describe("pricing", () => {
  it("calculates subtotal with sale prices", () => {
    const sub = calculateSubtotal([
      { productId: "1", quantity: 2, unitPrice: 1000, salePrice: 800 },
      { productId: "2", quantity: 1, unitPrice: 500, salePrice: null },
    ]);
    expect(sub).toBe(2100);
  });

  it("applies free shipping over threshold", () => {
    expect(calculateShipping(3500)).toBe(0);
    expect(calculateShipping(1000)).toBe(200);
  });

  it("calculates totals with coupon", () => {
    const t = calculateOrderTotals({
      lines: [{ productId: "1", quantity: 1, unitPrice: 1000 }],
      couponDiscount: 100,
    });
    expect(t.subtotal).toBe(1000);
    expect(t.discountAmount).toBe(100);
    expect(t.shippingAmount).toBe(200);
    expect(t.total).toBe(1100);
  });
});
