import { describe, expect, it } from "vitest";
import {
  applyAutomaticDiscounts,
  type AutomaticDiscountRule,
} from "../../lib/discounts/apply-automatic-discounts";

function rule(overrides: Partial<AutomaticDiscountRule> = {}): AutomaticDiscountRule {
  return {
    id: "discount-1",
    name: "Product offer",
    type: "PERCENTAGE",
    value: 20,
    scope: "PRODUCT",
    minOrderAmount: null,
    maxDiscount: null,
    startsAt: null,
    endsAt: null,
    isActive: true,
    usageLimit: null,
    usageCount: 0,
    products: [{ productId: "product-1" }],
    categories: [],
    ...overrides,
  };
}

describe("automatic product discounts", () => {
  it("calculates percentage discounts from the regular product price", () => {
    const result = applyAutomaticDiscounts(
      [{ id: "product-1", price: 1000, salePrice: null, categoryId: null }],
      [rule()],
    ).get("product-1");

    expect(result).toMatchObject({
      unitPrice: 800,
      originalPrice: 1000,
      discountId: "discount-1",
      discountAmount: 200,
    });
  });

  it("uses the best matching discount without stacking offers", () => {
    const result = applyAutomaticDiscounts(
      [{ id: "product-1", price: 1000, salePrice: null, categoryId: null }],
      [
        rule({ id: "lower", value: 10 }),
        rule({ id: "higher", name: "Best offer", value: 25 }),
      ],
    ).get("product-1");

    expect(result?.unitPrice).toBe(750);
    expect(result?.discountId).toBe("higher");
  });

  it("respects product/category eligibility, minimum subtotal, and usage limits", () => {
    const result = applyAutomaticDiscounts(
      [{ id: "product-1", price: 1000, salePrice: null, categoryId: "category-1" }],
      [
        rule({ scope: "CATEGORY", products: [], categories: [{ id: "category-1" }], value: 30 }),
        rule({ id: "minimum", value: 50, minOrderAmount: 2000 }),
        rule({ id: "exhausted", value: 60, usageLimit: 1, usageCount: 1 }),
      ],
      1000,
    ).get("product-1");

    expect(result?.unitPrice).toBe(700);
    expect(result?.discountId).toBe("discount-1");
  });

  it("does not replace a better existing sale price and caps fixed discounts at zero", () => {
    const result = applyAutomaticDiscounts(
      [
        { id: "product-1", price: 1000, salePrice: 700, categoryId: null },
        { id: "product-2", price: 50, salePrice: null, categoryId: null },
      ],
      [
        rule({ type: "FIXED_AMOUNT", value: 200 }),
        rule({ id: "product-2-off", type: "FIXED_AMOUNT", value: 100, products: [{ productId: "product-2" }] }),
      ],
    );

    expect(result.get("product-1")?.unitPrice).toBe(700);
    expect(result.get("product-2")?.unitPrice).toBe(0);
  });
});
