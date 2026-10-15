"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProductCard, type ProductCardData } from "@/components/product/product-card";

export function ProductCollectionRow({ products }: { products: ProductCardData[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [indicatorWidth, setIndicatorWidth] = useState(100);
  const isScrollable = products.length > 4;

  const updateProgress = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const range = track.scrollWidth - track.clientWidth;
    setScrollProgress(range > 0 ? Math.min(100, (track.scrollLeft / range) * 100) : 0);
    setIndicatorWidth(track.scrollWidth > 0 ? Math.min(100, (track.clientWidth / track.scrollWidth) * 100) : 100);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !isScrollable) return;
    updateProgress();
    const observer = new ResizeObserver(updateProgress);
    observer.observe(track);
    return () => observer.disconnect();
  }, [isScrollable, products.length, updateProgress]);

  if (!isScrollable) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    );
  }

  return (
    <div>
      <div
        ref={trackRef}
        className="product-collection-track"
        onScroll={updateProgress}
        tabIndex={0}
        aria-label="Featured products. Swipe or scroll horizontally to see all products."
        aria-roledescription="carousel"
      >
        {products.map((product) => (
          <div className="product-collection-slide" key={product.id}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
      <div className="mt-3 flex h-2 items-center justify-center">
        <div className="customer-reviews-indicator" role="progressbar" aria-label="Featured products position" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(scrollProgress)}>
          <span style={{ width: `${indicatorWidth}%`, left: `${(scrollProgress * (100 - indicatorWidth)) / 100}%` }} />
        </div>
      </div>
    </div>
  );
}
