"use client";

type CategorySortFormProps = {
  action: string;
  sort: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: string;
  onSale?: string;
  category?: string;
  searchQuery?: string;
};

export function CategorySortForm({
  action,
  sort,
  minPrice,
  maxPrice,
  inStock,
  onSale,
  category,
  searchQuery,
}: CategorySortFormProps) {
  return (
    <form action={action} method="get" className="flex items-center gap-2">
      {category && <input type="hidden" name="category" value={category} />}
      {searchQuery && <input type="hidden" name="q" value={searchQuery} />}
      {minPrice && <input type="hidden" name="minPrice" value={minPrice} />}
      {maxPrice && <input type="hidden" name="maxPrice" value={maxPrice} />}
      {inStock && <input type="hidden" name="inStock" value={inStock} />}
      {onSale && <input type="hidden" name="onSale" value={onSale} />}
      <label htmlFor="category-sort" className="hidden text-sm text-[var(--muted)] sm:inline">
        Sort by
      </label>
      <select
        id="category-sort"
        name="sort"
        defaultValue={sort}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-10 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3 text-sm focus:border-[var(--brand-pink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)]/20"
      >
        <option value="featured">Featured</option>
        <option value="newest">Newest</option>
        <option value="price-low">Price: low to high</option>
        <option value="price-high">Price: high to low</option>
        <option value="name">Name: A to Z</option>
      </select>
    </form>
  );
}
