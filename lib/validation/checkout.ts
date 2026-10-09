import { z } from "zod";

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name is required").max(100),
  customerEmail: z.string().email("Valid email required"),
  customerPhone: z
    .string()
    .min(10, "Phone number required")
    .max(20)
    .regex(/^[+]?[\d\s-]+$/, "Invalid phone number"),
  shippingLine1: z.string().min(5, "Address is required").max(200),
  shippingLine2: z.string().max(200).optional().nullable(),
  shippingCity: z.string().min(2, "City is required").max(100),
  shippingProvince: z.string().min(2, "Province is required").max(100),
  shippingPostalCode: z.string().max(20).optional().nullable(),
  deliveryNotes: z.string().max(500).optional().nullable(),
  paymentMethod: z.enum(["COD", "CARD", "EASYPAISA", "JAZZCASH", "BANK_TRANSFER"]).default("COD"),
  couponCode: z.string().max(50).optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1, "Cart cannot be empty"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
