import { ProductCard } from "@/components/product/product-card";
import { getFeaturedProducts } from "@/lib/db/queries/products";

export const metadata = {
  title: "Featured Pieces | Mini Street",
  description: "Explore the pieces handpicked by Mini Street.",
};

export default async function FeaturedPage() {
  let products: Awaited<ReturnType<typeof getFeaturedProducts>>["products"] = [];
  try {
    ({ products } = await getFeaturedProducts());
  } catch (error) {
    console.error("[featured] Failed to load products.", error);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <p className="section-label mb-2">Chosen with care</p>
      <h1 className="mb-2 font-display text-3xl font-semibold sm:text-4xl">Featured pieces</h1>
      <p className="mb-8 text-sm text-[var(--muted)]">A curated edit of Mini Street favorites.</p>
      {products.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] px-6 py-12 text-center text-sm text-[var(--muted)]">
          Featured pieces will appear here once selected in the admin panel.
        </p>
      )}
    </div>
  );
}
