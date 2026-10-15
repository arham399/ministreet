ALTER TABLE "Product" ADD COLUMN "colorGroupId" text;--> statement-breakpoint
ALTER TABLE "Product" ADD COLUMN "colorName" text;--> statement-breakpoint
ALTER TABLE "Product" ADD COLUMN "colorHex" text;--> statement-breakpoint
CREATE INDEX "Product_colorGroupId_idx" ON "Product" USING btree ("colorGroupId" text_ops);