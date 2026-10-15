"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Check, Heart, Sparkles, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDiscount } from "@/lib/utils";
import { useCartStore } from "@/lib/cart/store";
import { useWishlistStore } from "@/lib/cart/wishlist-store";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  imageUrl?: string | null;
  colorName?: string | null;
  colorCount?: number;
  isNewArrival?: boolean;
  stockQuantity?: number;
  averageRating?: number | null;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const isWishlisted = useWishlistStore((state) => state.items.some((item) => item.productId === product.id));
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
      colorName: product.colorName,
      stockQuantity: product.stockQuantity ?? 0,
      quantity: 1,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[16px] border border-[var(--border)]/75 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--brand-pink-soft)] hover:shadow-soft-md sm:rounded-[20px]">
      <div className="product-card-media relative aspect-[1.08] overflow-hidden sm:aspect-[1.12]">
        <Link href={`/product/${product.slug}`} className="absolute inset-0 block">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-2.5 product-image-zoom sm:p-3"
            />
          ) : (
            <div className="product-fallback absolute inset-0 flex flex-col items-center justify-center gap-3 text-[var(--muted)]">
              <span className="product-fallback-jewel" aria-hidden="true"><Sparkles size={27} strokeWidth={1.15} /></span>
              <span className="text-[9px] font-medium uppercase tracking-[.24em] opacity-65">Mini Street</span>
            </div>
          )}
        </Link>

        {/* Soft gradient overlay on hover */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#5f3b4b]/10 via-transparent to-transparent opacity-0 transition-opacity duration-400 group-hover:opacity-100" />

        <div className="absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1.5 sm:left-3 sm:top-3">
          {product.isNewArrival && <Badge className="min-w-[62px] justify-center px-2.5 py-1 text-[9px] tracking-[.1em]" variant="new">NEW</Badge>}
          {onSale && <Badge className="min-w-[62px] justify-center px-2.5 py-1 text-[9px] tracking-[.08em]" variant="sale">{discountPct}% OFF</Badge>}
          {!inStock && <Badge variant="outline">SOLD OUT</Badge>}
        </div>

        <button
          type="button"
          onClick={() => toggleWishlist({
            productId: product.id,
            slug: product.slug,
            name: product.name,
            imageUrl: product.imageUrl,
            unitPrice: product.price,
            salePrice: product.salePrice,
          })}
          className="absolute right-2.5 top-2.5 z-10 rounded-full bg-white/90 p-2.5 shadow-soft backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white sm:right-3 sm:top-3 sm:p-3 sm:opacity-0 sm:group-hover:opacity-100"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? "fill-[var(--brand-pink)] text-[var(--brand-pink)]" : "text-[var(--charcoal)]"}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col px-2.5 pb-2.5 pt-2.5 sm:px-3.5 sm:pb-3 sm:pt-3">
        <Link href={`/product/${product.slug}`}>
          <h3 className="line-clamp-2 text-xs font-medium leading-snug text-[var(--charcoal)] transition-colors duration-300 group-hover:text-[var(--brand-pink)] sm:text-sm">
            {product.name}
          </h3>
        </Link>

        {product.averageRating != null && product.averageRating > 0 && (
          <p className="mt-1 flex items-center gap-1 text-[10px] tracking-wide text-[var(--muted)]">
            <Star size={10} aria-hidden="true" />
            {product.averageRating.toFixed(1)}
          </p>
        )}

        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="text-[13px] font-semibold tracking-tight text-[var(--charcoal)] sm:text-sm">
            {formatPrice(onSale ? product.salePrice! : product.price)}
          </span>
          {onSale && (
            <span className="text-[11px] text-[var(--muted)] line-through sm:text-xs">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        {(product.colorCount ?? 0) > 1 && (
          <p className="mt-1 text-[10px] text-[var(--muted)] sm:text-xs">
            Available in {product.colorCount} colors
          </p>
        )}

        <div className="mt-auto pt-2.5 sm:pt-3">
          {(product.colorCount ?? 0) > 1 ? (
            <Button asChild size="sm" className="h-8 w-full rounded-full px-2 text-[10px] tracking-wide sm:h-9 sm:text-xs">
              <Link href={`/product/${product.slug}`}>Choose a color</Link>
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-8 w-full rounded-full px-2 text-[10px] tracking-wide sm:h-9 sm:text-xs"
              disabled={!inStock}
              onClick={handleAddToCart}
              aria-label={!inStock ? "Sold out" : added ? `${product.name} added to cart` : `Add ${product.name} to cart`}
            >
              {!inStock ? "Sold Out" : added ? <>Added to Cart<Check className="ml-1.5 inline-block h-4 w-4" aria-hidden="true" /></> : "Add to Cart"}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
