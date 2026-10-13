"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { MoreHorizontal, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import type { StoreCategory } from "@/lib/db/drizzle/queries/categories";
import { PriceRangeControls } from "@/components/product/price-range-controls";

type CategoryFilterDrawerProps = {
  action: string;
  sort: string;
  minPrice?: number;
  maxPrice?: number;
  priceCeiling: number;
  inStock: boolean;
  onSale: boolean;
  activeFilterCount: number;
  clearHref: string;
  selectedCategory?: string;
  searchQuery?: string;
  showCategoryFilter?: boolean;
  categories: StoreCategory[];
};

export function CategoryFilterDrawer({
  action,
  sort,
  minPrice,
  maxPrice,
  priceCeiling,
  inStock,
  onSale,
  activeFilterCount,
  clearHref,
  selectedCategory,
  searchQuery,
  showCategoryFilter = false,
  categories,
}: CategoryFilterDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3.5 text-sm font-medium text-[var(--charcoal)] shadow-soft transition-colors hover:border-[var(--brand-pink)] hover:text-[var(--brand-pink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)]"
          aria-label={activeFilterCount > 0 ? `Open filters, ${activeFilterCount} active` : "Open filters"}
        >
          <MoreHorizontal size={18} aria-hidden="true" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-[var(--brand-pink)] text-[10px] font-semibold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#21151d]/45 backdrop-blur-[1px] data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          aria-describedby="category-filter-description"
          className="fixed inset-y-2 right-2 z-50 flex w-[min(22rem,calc(100vw-1rem))] flex-col rounded-[28px] border border-[var(--border)] bg-white shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right sm:inset-y-3 sm:right-3"
        >
          <div className="flex items-start justify-between border-b border-[var(--border)] px-5 py-5">
            <div>
              <Dialog.Title className="flex items-center gap-2 font-display text-xl font-semibold text-[var(--charcoal)]">
                <SlidersHorizontal size={19} className="text-[var(--brand-pink)]" />
                Filter products
              </Dialog.Title>
              <Dialog.Description id="category-filter-description" className="mt-1 text-xs text-[var(--muted)]">
                Narrow this collection to find your perfect piece.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close filters"
                className="rounded-full p-2 text-[var(--muted)] transition-colors hover:bg-[var(--brand-blush)] hover:text-[var(--charcoal)]"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <form
            action={action}
            method="get"
            className="flex min-h-0 flex-1 flex-col"
          >
            <input type="hidden" name="sort" value={sort} />
            {searchQuery && <input type="hidden" name="q" value={searchQuery} />}
            <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6">
              {showCategoryFilter && (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--charcoal)]">Category</span>
                  <select
                    name="category"
                    defaultValue={selectedCategory || ""}
                    className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3 text-sm focus:border-[var(--brand-pink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)]/20"
                  >
                    <option value="">All categories</option>
                    {categories.map((category) => (
                      <option key={category.slug} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <fieldset>
                <legend className="mb-3 text-sm font-semibold text-[var(--charcoal)]">Price range</legend>
                <p className="mb-3 text-xs text-[var(--muted)]">Choose a range or enter exact prices.</p>
                <PriceRangeControls
                  key={`${selectedCategory || "all"}:${minPrice ?? ""}:${maxPrice ?? ""}:${priceCeiling}`}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  ceiling={priceCeiling}
                />
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="mb-3 text-sm font-semibold text-[var(--charcoal)]">Availability & offers</legend>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border)] px-3.5 py-3 text-sm transition-colors hover:border-[var(--brand-pink-soft)]">
                  <input
                    type="checkbox"
                    name="inStock"
                    value="1"
                    defaultChecked={inStock}
                    className="size-4 accent-[var(--brand-pink)]"
                  />
                  <span className="text-[var(--charcoal)]">In stock</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border)] px-3.5 py-3 text-sm transition-colors hover:border-[var(--brand-pink-soft)]">
                  <input
                    type="checkbox"
                    name="onSale"
                    value="1"
                    defaultChecked={onSale}
                    className="size-4 accent-[var(--brand-pink)]"
                  />
                  <span className="text-[var(--charcoal)]">On sale</span>
                </label>
              </fieldset>
            </div>

            <div className="flex items-center gap-3 border-t border-[var(--border)] bg-white px-5 py-4">
              {activeFilterCount > 0 && (
                <Dialog.Close asChild>
                  <Link
                    href={clearHref}
                    className="inline-flex h-11 items-center justify-center rounded-[var(--radius-sm)] px-3 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--brand-pink)]"
                  >
                    Clear all
                  </Link>
                </Dialog.Close>
              )}
              <button
                type="submit"
                className="inline-flex h-11 flex-1 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-pink)] px-5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-[var(--brand-pink-deep)]"
              >
                Apply filters
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
