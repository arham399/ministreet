"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { StoreCategory } from "@/lib/db/drizzle/queries/categories";

const categoryImages: Record<string, string> = {
  earrings: "/assets/categories/earrings.png",
  bracelets: "/assets/categories/bracelets.png",
  necklaces: "/assets/categories/necklaces.png",
  rings: "/assets/categories/rings.png",
  watches: "/assets/categories/watches.png",
  handchains: "/assets/categories/handchains.png",
  handcuffs: "/assets/categories/handcuffs.png",
  "combo-sets": "/assets/categories/combo-sets.png",
};

export function CategoryCarousel({ categories }: { categories: StoreCategory[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);

  function updateProgress() {
    const element = scroller.current;
    if (!element) return;
    const maxScroll = element.scrollWidth - element.clientWidth;
    setHasOverflow(maxScroll > 1);
    setProgress(maxScroll > 0 ? element.scrollLeft / maxScroll : 0);
  }

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    updateProgress();
    const observer = new ResizeObserver(updateProgress);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div
        ref={scroller}
        onScroll={updateProgress}
        className="category-scroll flex w-full snap-x snap-mandatory justify-start gap-1 overflow-x-auto pt-2 pb-2 sm:gap-2 sm:pb-0 lg:justify-center lg:gap-5"
        aria-label="Browse product categories"
      >
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/shop/${category.slug}`}
            aria-label={category.name}
            className="category-link group flex w-16 shrink-0 snap-start items-center justify-center sm:w-[72px] lg:w-[88px]"
          >
            <Image
              src={categoryImages[category.slug] || "/assets/categories/earrings.png"}
              alt=""
              width={88}
              height={88}
              sizes="(max-width: 639px) 64px, (max-width: 1023px) 72px, 88px"
              className="aspect-square h-auto w-full max-w-16 rounded-full object-cover transition duration-300 group-hover:-translate-y-1 sm:h-[72px] sm:w-[72px] sm:max-w-none lg:h-[88px] lg:w-[88px]"
            />
          </Link>
        ))}
      </div>
      {hasOverflow && <div className="category-scroll-track" aria-hidden="true">
        <span style={{ transform: `translateX(${progress * 212}%)` }} />
      </div>}
    </>
  );
}
