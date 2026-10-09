"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/lib/cart/store";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FREE_SHIPPING_THRESHOLD, DEFAULT_SHIPPING_COST } from "@/lib/constants";
import { CartHydration } from "@/components/providers/cart-provider";

function CheckoutForm() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");

  const subtotal = getSubtotal();
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_COST;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold mb-3">Checkout</h1>
        <p className="text-[var(--muted)] mb-6">Your cart is empty.</p>
        <Button asChild>
          <Link href="/shop">Shop Collection</Link>
        </Button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      customerName: String(form.get("customerName") || ""),
      customerEmail: String(form.get("customerEmail") || ""),
      customerPhone: String(form.get("customerPhone") || ""),
      shippingLine1: String(form.get("shippingLine1") || ""),
      shippingLine2: String(form.get("shippingLine2") || "") || null,
      shippingCity: String(form.get("shippingCity") || ""),
      shippingProvince: String(form.get("shippingProvince") || ""),
      shippingPostalCode: String(form.get("shippingPostalCode") || "") || null,
      deliveryNotes: String(form.get("deliveryNotes") || "") || null,
      paymentMethod: "COD" as const,
      couponCode: couponCode || null,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Checkout failed. Please try again.");
        setLoading(false);
        return;
      }
      clearCart();
      router.push(`/order-success/${data.orderId}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <Link href="/" className="inline-block">
          <span className="font-display text-2xl font-semibold text-[var(--brand-pink)]">
            Mini Street
          </span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <section>
            <h2 className="font-semibold text-lg mb-4">1. Contact</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5" htmlFor="customerName">
                  Full name
                </label>
                <Input id="customerName" name="customerName" required autoComplete="name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="customerEmail">
                  Email
                </label>
                <Input id="customerEmail" name="customerEmail" type="email" required autoComplete="email" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="customerPhone">
                  Phone
                </label>
                <Input id="customerPhone" name="customerPhone" type="tel" required autoComplete="tel" />
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-semibold text-lg mb-4">2. Shipping</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5" htmlFor="shippingLine1">
                  Address
                </label>
                <Input id="shippingLine1" name="shippingLine1" required autoComplete="street-address" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5" htmlFor="shippingLine2">
                  Apartment, suite, etc. (optional)
                </label>
                <Input id="shippingLine2" name="shippingLine2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="shippingCity">
                  City
                </label>
                <Input id="shippingCity" name="shippingCity" required autoComplete="address-level2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="shippingProvince">
                  Province
                </label>
                <Input id="shippingProvince" name="shippingProvince" required autoComplete="address-level1" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="shippingPostalCode">
                  Postal code (optional)
                </label>
                <Input id="shippingPostalCode" name="shippingPostalCode" autoComplete="postal-code" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5" htmlFor="deliveryNotes">
                  Delivery notes (optional)
                </label>
                <Input id="deliveryNotes" name="deliveryNotes" />
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-semibold text-lg mb-4">3. Payment</h2>
            <div className="p-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--brand-cream)]">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="payment" value="COD" defaultChecked className="accent-[var(--brand-pink)]" />
                <span className="text-sm font-medium">Cash on Delivery</span>
              </label>
              <p className="text-xs text-[var(--muted)] mt-2 ml-6">
                Pay when your order arrives. More payment options coming soon.
              </p>
            </div>
          </section>

          {error && (
            <div className="p-4 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-sm text-[var(--error)]" role="alert">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={loading}>
            {loading ? "Placing order…" : "Place Order"}
          </Button>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-24 p-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white shadow-soft">
            <h2 className="font-semibold mb-4">Order Summary</h2>
            <ul className="space-y-3 mb-4">
              {items.map((item) => {
                const price =
                  item.salePrice != null && item.salePrice < item.unitPrice
                    ? item.salePrice
                    : item.unitPrice;
                return (
                  <li key={item.productId} className="flex justify-between text-sm">
                    <span className="text-[var(--muted)] line-clamp-1 pr-2">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="shrink-0">{formatPrice(price * item.quantity)}</span>
                  </li>
                );
              })}
            </ul>
            <div className="space-y-2 text-sm border-t border-[var(--border)] pt-3">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Shipping</span>
                <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-2">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Input
                placeholder="Coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <CartHydration>
      <CheckoutForm />
    </CartHydration>
  );
}
