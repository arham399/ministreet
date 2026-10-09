"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/lib/cart/wishlist-store";
import { useCartStore } from "@/lib/cart/store";
import { formatPrice } from "@/lib/utils";
import { CartHydration } from "@/components/providers/cart-provider";

function WishlistContent() {
  const { items, remove } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold mb-3">Wishlist</h1>
        <p className="text-[var(--muted)] mb-6">Save your favourite pieces here.</p>
        <Button asChild>
          <Link href="/shop">Browse Treasures</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-semibold mb-6">Wishlist ({items.length})</h1>
      <ul className="space-y-4">
        {items.map((item) => {
          const price =
            item.salePrice != null && item.salePrice < item.unitPrice
              ? item.salePrice
              : item.unitPrice;
          return (
            <li
              key={item.productId}
              className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white"
            >
              <div>
                <Link href={`/product/${item.slug}`} className="font-medium text-sm hover:text-[var(--brand-pink)]">
                  {item.name}
                </Link>
                <p className="text-sm font-semibold mt-1">{formatPrice(price)}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    addItem({ ...item, stockQuantity: 99, quantity: 1 });
                    remove(item.productId);
                  }}
                >
                  Move to cart
                </Button>
                <Button size="sm" variant="outline" onClick={() => remove(item.productId)}>
                  Remove
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function WishlistPage() {
  return (
    <CartHydration>
      <WishlistContent />
    </CartHydration>
  );
}
