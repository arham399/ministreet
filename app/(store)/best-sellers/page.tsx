import { ProductCard } from "@/components/product/product-card";

export const metadata = { title: "Best Sellers" };

export default function BestSellersPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-2">Loved by Mini Street Girls</h1>
      <p className="text-sm text-[var(--muted)] mb-8">Our most-loved pieces, calculated from real orders once data is available.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        <ProductCard product={{ id: "2", name: "Golden Heart Bracelet", slug: "golden-heart-bracelet", price: 1899, salePrice: 1499, stockQuantity: 18 }} />
        <ProductCard product={{ id: "1", name: "Pearl Drop Earrings", slug: "pearl-drop-earrings", price: 1599, salePrice: 1299, stockQuantity: 25 }} />
      </div>
    </div>
  );
}
