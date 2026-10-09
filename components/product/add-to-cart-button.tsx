"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/cart/store";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Heart } from "lucide-react";

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
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  function handleAdd() {
    addItem({ ...product, quantity: qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center border border-[var(--border)] rounded-[var(--radius-md)]">
          <button
            type="button"
            className="p-2.5 hover:bg-[var(--brand-blush)]"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-sm font-medium">{qty}</span>
          <button
            type="button"
            className="p-2.5 hover:bg-[var(--brand-blush)]"
            onClick={() => setQty((q) => Math.min(product.stockQuantity || 20, q + 1))}
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleAdd}
          disabled={disabled}
          size="lg"
          className="flex-1"
        >
          {added ? "Added ✓" : "Add to Cart"}
        </Button>
        <Button variant="outline" size="lg" className="flex-1" disabled={disabled}>
          Buy Now
        </Button>
      </div>
      <button
        type="button"
        className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--brand-pink)]"
      >
        <Heart className="h-4 w-4" /> Add to Wishlist
      </button>
    </div>
  );
}
