"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart/store";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Heart } from "lucide-react";
import { useWishlistStore } from "@/lib/cart/wishlist-store";
import { formatPrice } from "@/lib/utils";

type Props = {
  product: {
    productId: string;
    slug: string;
    name: string;
    unitPrice: number;
    salePrice?: number | null;
    stockQuantity: number;
    imageUrl?: string | null;
  };
  disabled?: boolean;
};

export function AddToCartButton({ product, disabled }: Props) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const unitPrice =
    product.salePrice != null && product.salePrice < product.unitPrice
      ? product.salePrice
      : product.unitPrice;
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.items.some((item) => item.productId === product.productId));

  function handleAdd() {
    addItem({ ...product, quantity: qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    addItem({ ...product, quantity: qty });
    router.push("/checkout");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start gap-2">
        <div className="flex items-center border border-[var(--border)] rounded-[var(--radius-md)]">
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-l-[var(--radius-md)] hover:bg-[var(--brand-blush)]"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-sm font-medium">{qty}</span>
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-r-[var(--radius-md)] hover:bg-[var(--brand-blush)]"
            onClick={() => setQty((q) => Math.min(product.stockQuantity || 20, q + 1))}
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-[var(--muted)]" aria-live="polite">
          Subtotal ({qty} {qty === 1 ? "item" : "items"}):{" "}
          <span className="font-semibold text-[var(--charcoal)]">
            {formatPrice(unitPrice * qty)}
          </span>
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleAdd}
          disabled={disabled}
          size="lg"
          className="h-14 min-h-14 w-full flex-1 text-base sm:h-12 sm:min-h-12 sm:text-[15px]"
        >
          {added ? "Added ✓" : "Add to Cart"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-14 min-h-14 w-full flex-1 text-base sm:h-12 sm:min-h-12 sm:text-[15px]"
          disabled={disabled}
          onClick={handleBuyNow}
        >
          Buy Now
        </Button>
      </div>
      <button
        type="button"
        onClick={() => toggleWishlist(product)}
        className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--brand-pink)]"
        aria-pressed={isWishlisted}
      >
        <Heart className={`h-4 w-4 ${isWishlisted ? "fill-[var(--brand-pink)] text-[var(--brand-pink)]" : ""}`} />
        {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
      </button>
    </div>
  );
}
