"use client";

import Link from "next/link";
import Image from "next/image";
import { Trash2, Minus, Plus } from "lucide-react";
import { useCartStore } from "@/lib/cart/store";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FREE_SHIPPING_THRESHOLD, DEFAULT_SHIPPING_COST } from "@/lib/constants";
import { CartHydration } from "@/components/providers/cart-provider";

function CartContent() {
  const { items, updateQuantity, removeItem, getSubtotal } = useCartStore();
  const subtotal = getSubtotal();
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_COST;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold mb-3">Your Cart</h1>
        <p className="text-[var(--muted)] mb-6">Nothing here yet. Discover something beautiful.</p>
        <Button asChild>
          <Link href="/shop">Shop Collection</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="font-display text-3xl font-semibold mb-8">Your Cart</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const price =
              item.salePrice != null && item.salePrice < item.unitPrice
                ? item.salePrice
                : item.unitPrice;
            return (
              <div
                key={item.productId}
                className="flex gap-4 p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white"
              >
                <div className="relative w-20 h-24 sm:w-24 sm:h-28 shrink-0 rounded-[var(--radius-md)] overflow-hidden bg-[var(--brand-cream)]">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="96px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-[var(--muted)]">—</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/product/${item.slug}`}
                    className="font-medium text-sm hover:text-[var(--brand-pink)] line-clamp-2"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm font-semibold mt-1">{formatPrice(price)}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center border border-[var(--border)] rounded-[var(--radius-sm)]">
                      <button
                        type="button"
                        className="p-1.5 hover:bg-[var(--brand-blush)]"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        className="p-1.5 hover:bg-[var(--brand-blush)]"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="p-1.5 text-[var(--muted)] hover:text-[var(--error)]"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="text-sm font-semibold shrink-0">
                  {formatPrice(price * item.quantity)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 p-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white shadow-soft">
            <h2 className="font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Shipping</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-[var(--success)]">Free</span>
                  ) : (
                    formatPrice(shipping)
                  )}
                </span>
              </div>
              {subtotal < FREE_SHIPPING_THRESHOLD && (
                <p className="text-xs text-[var(--muted)]">
                  Add {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping
                </p>
              )}
              <div className="border-t border-[var(--border)] pt-3 flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <Button asChild className="w-full mt-6" size="lg">
              <Link href="/checkout">Checkout</Link>
            </Button>
            <Link
              href="/shop"
              className="block text-center text-sm text-[var(--brand-pink)] mt-3 hover:underline"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <CartHydration>
      <CartContent />
    </CartHydration>
  );
}
