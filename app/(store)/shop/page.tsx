import { ProductCard } from "@/components/product/product-card";
import { getProducts } from "@/lib/db/queries/products";
import { CATEGORIES } from "@/lib/constants";
import Link from "next/link";

export const metadata = {
  title: "Shop All",
  description: "Discover all Mini Street treasures — earrings, bracelets, necklaces, rings and more.",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const sort = typeof sp.sort === "string" ? sp.sort : "featured";
  const page = Number(sp.page || 1);

  let result = {
    products: [] as {
      id: string;
      name: string;
      slug: string;
      price: number;
      salePrice: number | null;
      imageUrl: string | null;
      isNewArrival?: boolean;
      stockQuantity: number;
      averageRating: number | null;
    }[],
    total: 0,
    totalPages: 0,
  };

  try {
    result = await getProducts({ category, q, sort, page, limit: 24 });
  } catch {
    // Demo fallback
    result = {
      products: [
        { id: "1", name: "Pearl Drop Earrings", slug: "pearl-drop-earrings", price: 1599, salePrice: 1299, imageUrl: null, isNewArrival: true, stockQuantity: 25, averageRating: null },
        { id: "2", name: "Golden Heart Bracelet", slug: "golden-heart-bracelet", price: 1899, salePrice: 1499, imageUrl: null, isNewArrival: true, stockQuantity: 18, averageRating: null },
      ],
      total: 2,
      totalPages: 1,
    };
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <nav className="text-sm text-[var(--muted)] mb-4">
        <Link href="/" className="hover:text-[var(--brand-pink)]">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--charcoal)]">Shop</span>
      </nav>
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--charcoal)]">Shop All</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Discover all Mini Street treasures</p>
      </div>
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24 space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-3">Category</h3>
              <ul className="space-y-2 text-sm text-[var(--muted)]">
                <li>
                  <Link href="/shop" className={!category ? "text-[var(--brand-pink)] font-medium" : "hover:text-[var(--charcoal)]"}>
                    All
                  </Link>
                </li>
                {CATEGORIES.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/shop?category=${c.slug}`}
                      className={category === c.slug ? "text-[var(--brand-pink)] font-medium" : "hover:text-[var(--charcoal)]"}
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-[var(--muted)]">{result.total} treasures</p>
            <form>
              <select
                name="sort"
                defaultValue={sort}
                className="h-9 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-sm bg-white"
                aria-label="Sort products"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </form>
          </div>
          {result.products.length === 0 ? (
            <p className="text-center text-[var(--muted)] py-16">No products found.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {result.products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
