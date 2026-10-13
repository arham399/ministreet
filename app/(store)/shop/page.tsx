import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CategoryFilterDrawer } from "@/components/product/category-filter-drawer";
import { CategorySortForm } from "@/components/product/category-sort-form";
import { ProductCard, type ProductCardData } from "@/components/product/product-card";
import { getStoreCategories } from "@/lib/db/drizzle/queries/categories";
import { getProductPriceCeiling, getProducts } from "@/lib/db/queries/products";

export const metadata = {
  title: "Shop All",
  description: "Discover all Mini Street treasures — earrings, bracelets, necklaces, rings and more.",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function singleParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function validPrice(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const price = Number(value);
  return Number.isSafeInteger(price) && price >= 0 ? price : undefined;
}

function validPage(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function queryHref(values: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) query.set(key, value);
  }
  const suffix = query.toString();
  return `/shop${suffix ? `?${suffix}` : ""}`;
}

export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams;
  const categories = await getStoreCategories();
  const requestedCategory = singleParam(sp.category);
  const category = categories.some((item) => item.slug === requestedCategory)
    ? requestedCategory
    : undefined;
  if (requestedCategory && !category) notFound();

  const q = singleParam(sp.q)?.trim().slice(0, 100) || undefined;
  const minPrice = validPrice(singleParam(sp.minPrice));
  const maxPrice = validPrice(singleParam(sp.maxPrice));
  const page = validPage(singleParam(sp.page));
  const sortValues = ["featured", "newest", "price-low", "price-high", "name"];
  const requestedSort = singleParam(sp.sort);
  const sort = requestedSort && sortValues.includes(requestedSort) ? requestedSort : "featured";
  const inStock = singleParam(sp.inStock) === "1";
  const onSale = singleParam(sp.onSale) === "1";
  const filterValues = {
    category,
    q,
    sort: sort === "featured" ? undefined : sort,
    minPrice: minPrice == null ? undefined : String(minPrice),
    maxPrice: maxPrice == null ? undefined : String(maxPrice),
    inStock: inStock ? "1" : undefined,
    onSale: onSale ? "1" : undefined,
  };

  let result: {
    products: ProductCardData[];
    total: number;
    page: number;
    totalPages: number;
  };
  let priceCeiling = 1;

  try {
    [result, priceCeiling] = await Promise.all([
      getProducts({
        category,
        q,
        minPrice,
        maxPrice,
        inStock,
        onSale,
        sort,
        page,
        limit: 24,
      }),
      getProductPriceCeiling(category),
    ]);
  } catch (error) {
    console.error("[shop] Failed to load products; showing demo products instead.", error);
    const demoProducts: (ProductCardData & { categorySlug: string })[] = [
      {
        id: "1",
        name: "Pearl Drop Earrings",
        slug: "pearl-drop-earrings",
        price: 1599,
        salePrice: 1299,
        imageUrl: null,
        isNewArrival: true,
        stockQuantity: 25,
        averageRating: null,
        categorySlug: "earrings",
      },
      {
        id: "2",
        name: "Golden Heart Bracelet",
        slug: "golden-heart-bracelet",
        price: 1899,
        salePrice: 1499,
        imageUrl: null,
        isNewArrival: true,
        stockQuantity: 18,
        averageRating: null,
        categorySlug: "bracelets",
      },
    ];
    priceCeiling = Math.max(
      1,
      ...demoProducts
        .filter((product) => !category || product.categorySlug === category)
        .map((product) => product.price)
    );
    const filteredProducts = demoProducts.filter((product) => {
      const effectivePrice = product.salePrice ?? product.price;
      const matchesQuery =
        !q ||
        product.name.toLowerCase().includes(q.toLowerCase()) ||
        product.categorySlug.includes(q.toLowerCase());
      return (
        (!category || product.categorySlug === category) &&
        matchesQuery &&
        (!inStock || (product.stockQuantity ?? 0) > 0) &&
        (!onSale || product.salePrice != null) &&
        (minPrice == null || effectivePrice >= minPrice) &&
        (maxPrice == null || effectivePrice <= maxPrice)
      );
    });
    if (sort === "price-low") filteredProducts.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
    if (sort === "price-high") filteredProducts.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
    if (sort === "name") filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
    const start = (page - 1) * 24;
    result = {
      products: filteredProducts.slice(start, start + 24),
      total: filteredProducts.length,
      page,
      totalPages: Math.ceil(filteredProducts.length / 24),
    };
  }

  if (page > Math.max(1, result.totalPages)) {
    redirect(queryHref(filterValues));
  }

  const activeFilterCount =
    Number(Boolean(category)) +
    Number(minPrice != null) +
    Number(maxPrice != null) +
    Number(inStock) +
    Number(onSale);
  const hasFilters = activeFilterCount > 0;
  const clearHref = queryHref({
    q,
    sort: sort === "featured" ? undefined : sort,
  });
  const firstProduct = result.total === 0 ? 0 : (result.page - 1) * 24 + 1;
  const lastProduct = Math.min(result.page * 24, result.total);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-[var(--muted)]">
        <Link href="/" className="hover:text-[var(--brand-pink)]">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--charcoal)]">Shop</span>
      </nav>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-[var(--charcoal)] sm:text-4xl">Shop All</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {q ? `Search results for “${q}”` : "Discover all Mini Street treasures"}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
        <p className="text-sm font-medium text-[var(--charcoal)]">
          {result.total} {result.total === 1 ? "product" : "products"}
          {hasFilters && <span className="ml-1 font-normal text-[var(--muted)]">{" "}matching your filters</span>}
        </p>
        <div className="flex items-center gap-2.5">
          <CategorySortForm
            action="/shop"
            category={category}
            searchQuery={q}
            sort={sort}
            minPrice={filterValues.minPrice}
            maxPrice={filterValues.maxPrice}
            inStock={filterValues.inStock}
            onSale={filterValues.onSale}
          />
          <CategoryFilterDrawer
            action="/shop"
            sort={sort}
            minPrice={minPrice}
            maxPrice={maxPrice}
            priceCeiling={priceCeiling}
            inStock={inStock}
            onSale={onSale}
            activeFilterCount={activeFilterCount}
            clearHref={clearHref}
            selectedCategory={category}
            searchQuery={q}
            showCategoryFilter
            categories={categories}
          />
        </div>
      </div>

      {result.products.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] px-6 py-16 text-center">
          <h2 className="font-display text-xl text-[var(--charcoal)]">
            {hasFilters || q ? "No products match your selection" : "A little sparkle is on its way"}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {hasFilters || q
              ? "Try adjusting your search or filters."
              : "Products will appear here once they are added to the shop."}
          </p>
          {(hasFilters || q) && (
            <Link href="/shop" className="mt-4 inline-flex text-sm font-medium text-[var(--brand-pink)] hover:underline">
              Clear search and filters
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
            {result.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {result.totalPages > 1 && (
            <nav aria-label="Product pages" className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
              <p className="text-sm text-[var(--muted)]">
                Showing {firstProduct}–{lastProduct} of {result.total} {result.total === 1 ? "product" : "products"}
              </p>
              <div className="flex items-center gap-2">
                {result.page > 1 ? (
                  <Link
                    href={queryHref({ ...filterValues, page: String(result.page - 1) })}
                    className="inline-flex h-10 items-center rounded-[var(--radius-sm)] border border-[var(--border)] px-4 text-sm font-medium hover:border-[var(--brand-pink)] hover:text-[var(--brand-pink)]"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="inline-flex h-10 items-center rounded-[var(--radius-sm)] border border-[var(--border)] px-4 text-sm text-[var(--muted)] opacity-50">Previous</span>
                )}
                <span className="px-2 text-sm text-[var(--muted)]">Page {result.page} of {result.totalPages}</span>
                {result.page < result.totalPages ? (
                  <Link
                    href={queryHref({ ...filterValues, page: String(result.page + 1) })}
                    className="inline-flex h-10 items-center rounded-[var(--radius-sm)] border border-[var(--border)] px-4 text-sm font-medium hover:border-[var(--brand-pink)] hover:text-[var(--brand-pink)]"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="inline-flex h-10 items-center rounded-[var(--radius-sm)] border border-[var(--border)] px-4 text-sm text-[var(--muted)] opacity-50">Next</span>
                )}
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
