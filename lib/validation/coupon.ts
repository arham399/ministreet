import { z } from "zod";

export const couponSchema = z.object({
  code: z.string().min(2).max(30).transform((s) => s.toUpperCase()),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  value: z.coerce.number().positive(),
  minOrderAmount: z.coerce.number().positive().optional().nullable(),
  maxDiscount: z.coerce.number().positive().optional().nullable(),
  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  perCustomerLimit: z.coerce.number().int().positive().optional().nullable(),
  startsAt: z.string().datetime().optional().nullable().or(z.string().optional().nullable()),
  endsAt: z.string().datetime().optional().nullable().or(z.string().optional().nullable()),
  isActive: z.boolean().default(true),
  eligibleProductIds: z.array(z.string()).default([]),
  eligibleCategoryIds: z.array(z.string()).default([]),
});

export const discountSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  value: z.coerce.number().positive(),
  scope: z.enum(["PRODUCT", "CATEGORY", "STOREWIDE"]),
  minOrderAmount: z.coerce.number().positive().optional().nullable(),
  maxDiscount: z.coerce.number().positive().optional().nullable(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().default(true),
  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  eligibleProductIds: z.array(z.string().min(1)).default([]),
  eligibleCategoryIds: z.array(z.string().min(1)).default([]),
}).superRefine((discount, context) => {
  if (discount.scope === "PRODUCT" && discount.eligibleProductIds.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["eligibleProductIds"],
      message: "Select at least one product for a product discount.",
    });
  }
  if (discount.scope === "CATEGORY" && discount.eligibleCategoryIds.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["eligibleCategoryIds"],
      message: "Select at least one category for a category discount.",
    });
  }
  if (discount.type === "PERCENTAGE" && discount.value > 100) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["value"],
      message: "Percentage discounts cannot exceed 100%.",
    });
  }
  if (discount.startsAt && discount.endsAt && new Date(discount.endsAt) <= new Date(discount.startsAt)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endsAt"],
      message: "The end date must be after the start date.",
    });
  }
});

export const offerSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  linkUrl: z.string().optional().nullable(),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce.number().int().default(0),
});
