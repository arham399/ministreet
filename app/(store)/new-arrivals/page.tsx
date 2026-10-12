import { ProductCard, type ProductCardData } from "@/components/product/product-card";
import { getNewArrivals } from "@/lib/db/queries/products";

export const metadata = { title: "New Arrivals" };

export default async function NewArrivalsPage() {
  let products: ProductCardData[] = [];
  try {
    ({ products } = await getNewArrivals(24));
  } catch (error) {
    console.error("[new-arrivals] Failed to load products.", error);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-2">New Arrivals</h1>
      <p className="text-sm text-[var(--muted)] mb-8">Meet the latest little treasures.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {products.length === 0 && (
        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] px-6 py-12 text-center text-sm text-[var(--muted)]">
          New treasures will appear here as they arrive.
        </p>
      )}
    </div>
  );
}
