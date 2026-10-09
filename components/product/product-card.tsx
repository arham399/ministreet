"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDiscount } from "@/lib/utils";
import { useCartStore } from "@/lib/cart/store";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  imageUrl?: string | null;
  isNewArrival?: boolean;
  stockQuantity?: number;
  averageRating?: number | null;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const inStock = (product.stockQuantity ?? 0) > 0;
  const onSale =
    product.salePrice != null && product.salePrice < product.price;
  const discountPct = onSale
    ? formatDiscount(product.price, product.salePrice!)
    : 0;

  function handleAddToCart() {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      unitPrice: product.price,
      salePrice: product.salePrice,
      imageUrl: product.imageUrl,
      stockQuantity: product.stockQuantity ?? 0,
      quantity: 1,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  }

  return (
    <article className="group relative flex flex-col rounded-[var(--radius-lg)] bg-white overflow-hidden border border-[var(--border)]/80 shadow-soft hover:shadow-soft-md hover:border-[var(--brand-pink-soft)] transition-all duration-400">
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-[var(--brand-blush)] to-[var(--brand-cream)]">
        <Link href={`/product/${product.slug}`} className="absolute inset-0 block">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover product-image-zoom"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[var(--muted)]">
              <span className="text-2xl opacity-40">✦</span>
              <span className="text-[11px] tracking-widest uppercase opacity-50">Mini Street</span>
            </div>
          )}
        </Link>

        {/* Soft gradient overlay on hover */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.isNewArrival && <Badge variant="new">NEW</Badge>}
          {onSale && <Badge variant="sale">{discountPct}% OFF</Badge>}
          {!inStock && <Badge variant="outline">SOLD OUT</Badge>}
        </div>

        <button
          type="button"
          className="absolute top-2.5 right-2.5 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-soft opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-105"
          aria-label="Add to wishlist"
        >
          <Heart className="h-3.5 w-3.5 text-[var(--charcoal)]" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <Link href={`/product/${product.slug}`}>
          <h3 className="text-[13px] sm:text-sm font-medium text-[var(--charcoal)] line-clamp-2 leading-snug group-hover:text-[var(--brand-pink)] transition-colors duration-300">
            {product.name}
          </h3>
        </Link>

        {product.averageRating != null && product.averageRating > 0 && (
          <p className="mt-1.5 text-[11px] text-[var(--muted)] tracking-wide">
            ★ {product.averageRating.toFixed(1)}
          </p>
        )}

        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-sm font-semibold tracking-tight text-[var(--charcoal)]">
            {formatPrice(onSale ? product.salePrice! : product.price)}
          </span>
          {onSale && (
            <span className="text-[11px] text-[var(--muted)] line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        <div className="mt-auto pt-3.5">
          <Button
            size="sm"
            className="w-full text-xs tracking-wide"
            disabled={!inStock}
            onClick={handleAddToCart}
            aria-label={inStock ? `Add ${product.name} to cart` : "Sold out"}
          >
            {!inStock ? "Sold Out" : added ? "Added ✓" : "Add to Cart"}
          </Button>
        </div>
      </div>
    </article>
  );
}
