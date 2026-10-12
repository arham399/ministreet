ALTER TABLE "Coupon" ADD COLUMN "campaignId" TEXT NOT NULL DEFAULT 'legacy';

ALTER TABLE "Order" ADD COLUMN "couponCampaignId" TEXT;

CREATE INDEX "Order_couponCode_couponCampaignId_idx" ON "Order"("couponCode", "couponCampaignId");
