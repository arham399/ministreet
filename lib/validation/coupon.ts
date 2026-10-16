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

function isSafeOfferUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname));
  } catch {
    return false;
  }
}

function normalizeOfferLink(value: string | null | undefined) {
  if (!value) return value;
  try {
    const url = new URL(value);
    if (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    // Relative store paths are already in the preferred form.
  }
  return value;
}

const optionalOfferUrl = z.string().trim().max(2048).optional().nullable().refine(
  (value) => !value || isSafeOfferUrl(value),
  "Use a secure https:// URL or a path on your store.",
);

export const offerSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  imageUrl: optionalOfferUrl,
  linkUrl: optionalOfferUrl.transform(normalizeOfferLink),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce.number().int().default(0),
}).superRefine((offer, context) => {
  if (offer.startsAt && offer.endsAt && new Date(offer.endsAt) <= new Date(offer.startsAt)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endsAt"],
      message: "The end date must be after the start date.",
    });
  }
});
