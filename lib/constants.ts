export const SITE_NAME = "Mini Street";
export const SITE_TAGLINE = "Adorably Enchanting Treasures";
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
export const INSTAGRAM_HANDLE = "@mini_street.co";
export const INSTAGRAM_URL = "https://instagram.com/mini_street.co";

export const CATEGORIES = [
  { name: "Earrings", slug: "earrings" },
  { name: "Bracelets", slug: "bracelets" },
  { name: "Necklaces", slug: "necklaces" },
  { name: "Rings", slug: "rings" },
  { name: "Watches", slug: "watches" },
  { name: "Handchains", slug: "handchains" },
  { name: "Handcuffs", slug: "handcuffs" },
  { name: "Combo Sets", slug: "combo-sets" },
] as const;

export const ORDER_STATUSES = [
  "PLACED",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "REFUNDED",
] as const;

export const FREE_SHIPPING_THRESHOLD = 3000; // Rs.
export const DEFAULT_SHIPPING_COST = 200; // Rs.

export const TRACKING_STATUS_COPY: Record<string, { title: string; description: string }> = {
  PLACED: {
    title: "Order Placed",
    description: "Your order has been received. We're excited to prepare your little treasures!",
  },
  CONFIRMED: {
    title: "Order Confirmed",
    description: "We've confirmed your order and are getting started.",
  },
  PROCESSING: {
    title: "Processing",
    description: "Your treasures are being carefully selected and prepared.",
  },
  PACKED: {
    title: "Packed",
    description: "Your little treasures are packed and ready to leave us.",
  },
  SHIPPED: {
    title: "Shipped",
    description: "Your order is on its way to you.",
  },
  OUT_FOR_DELIVERY: {
    title: "Out for Delivery",
    description: "Your package is out for delivery today.",
  },
  DELIVERED: {
    title: "Delivered",
    description: "Your Mini Street treasures have arrived. Enjoy!",
  },
  CANCELLED: {
    title: "Cancelled",
    description: "This order has been cancelled.",
  },
  RETURNED: {
    title: "Returned",
    description: "This order has been returned.",
  },
  REFUNDED: {
    title: "Refunded",
    description: "A refund has been processed for this order.",
  },
};
