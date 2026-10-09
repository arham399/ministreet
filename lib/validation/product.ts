import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sku: z.string().min(1).max(50),
  description: z.string().max(5000).optional().nullable(),
  price: z.coerce.number().positive(),
  salePrice: z.coerce.number().positive().optional().nullable(),
  costPrice: z.coerce.number().positive().optional().nullable(),
  stockQuantity: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  trackInventory: z.boolean().default(true),
  allowBackorder: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isNewArrival: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  badge: z.string().max(50).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
  imageUrls: z.array(z.string().url().or(z.string().startsWith("/"))).default([]),
});

export type ProductInput = z.infer<typeof productSchema>;
