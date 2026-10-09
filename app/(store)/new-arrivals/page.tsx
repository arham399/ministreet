import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";

export const metadata = { title: "New Arrivals" };

export default function NewArrivalsPage() {
  const products = [
    { id: "1", name: "Pearl Drop Earrings", slug: "pearl-drop-earrings", price: 1599, salePrice: 1299, isNewArrival: true, stockQuantity: 25 },
    { id: "2", name: "Golden Heart Bracelet", slug: "golden-heart-bracelet", price: 1899, salePrice: 1499, isNewArrival: true, stockQuantity: 18 },
  ];
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-2">New Arrivals</h1>
      <p className="text-sm text-[var(--muted)] mb-8">Meet the latest little treasures.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
