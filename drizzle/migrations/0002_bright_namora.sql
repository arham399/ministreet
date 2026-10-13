ALTER TABLE "Coupon" ALTER COLUMN "value" SET DATA TYPE numeric(14, 2);--> statement-breakpoint
ALTER TABLE "Coupon" ALTER COLUMN "minOrderAmount" SET DATA TYPE numeric(14, 2);--> statement-breakpoint
ALTER TABLE "Coupon" ALTER COLUMN "maxDiscount" SET DATA TYPE numeric(14, 2);--> statement-breakpoint
ALTER TABLE "Discount" ALTER COLUMN "value" SET DATA TYPE numeric(14, 2);--> statement-breakpoint
ALTER TABLE "Discount" ALTER COLUMN "minOrderAmount" SET DATA TYPE numeric(14, 2);--> statement-breakpoint
ALTER TABLE "Discount" ALTER COLUMN "maxDiscount" SET DATA TYPE numeric(14, 2);--> statement-breakpoint
ALTER TABLE "Order" ALTER COLUMN "subtotal" SET DATA TYPE numeric(14, 2);--> statement-breakpoint
ALTER TABLE "Order" ALTER COLUMN "discountAmount" SET DATA TYPE numeric(14, 2);--> statement-breakpoint
ALTER TABLE "Order" ALTER COLUMN "discountAmount" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "Order" ALTER COLUMN "shippingAmount" SET DATA TYPE numeric(14, 2);--> statement-breakpoint
ALTER TABLE "Order" ALTER COLUMN "shippingAmount" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "Order" ALTER COLUMN "total" SET DATA TYPE numeric(14, 2);--> statement-breakpoint
ALTER TABLE "Order" ALTER COLUMN "couponDiscount" SET DATA TYPE numeric(14, 2);--> statement-breakpoint
ALTER TABLE "OrderItem" ALTER COLUMN "unitPrice" SET DATA TYPE numeric(14, 2);--> statement-breakpoint
ALTER TABLE "OrderItem" ALTER COLUMN "discountAmount" SET DATA TYPE numeric(14, 2);--> statement-breakpoint
ALTER TABLE "OrderItem" ALTER COLUMN "discountAmount" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "OrderItem" ALTER COLUMN "finalPrice" SET DATA TYPE numeric(14, 2);--> statement-breakpoint
ALTER TABLE "Product" ALTER COLUMN "price" SET DATA TYPE numeric(14, 2);--> statement-breakpoint
ALTER TABLE "Product" ALTER COLUMN "salePrice" SET DATA TYPE numeric(14, 2);--> statement-breakpoint
ALTER TABLE "Product" ALTER COLUMN "costPrice" SET DATA TYPE numeric(14, 2);