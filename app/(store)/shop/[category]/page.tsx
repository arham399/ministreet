import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { CATEGORIES } from "@/lib/constants";

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props) {
  const { category } = await params;
  const cat = CATEGORIES.find((c) => c.slug === category);
  return { title: cat?.name || "Category" };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = CATEGORIES.find((c) => c.slug === category);
  if (!cat) notFound();

  // Demo products for category pages until DB is connected
  const products =
    category === "earrings"
      ? [{ id: "1", name: "Pearl Drop Earrings", slug: "pearl-drop-earrings", price: 1599, salePrice: 1299, isNewArrival: true, stockQuantity: 25 }]
      : category === "bracelets"
        ? [{ id: "2", name: "Golden Heart Bracelet", slug: "golden-heart-bracelet", price: 1899, salePrice: 1499, isNewArrival: true, stockQuantity: 18 }]
        : [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="rounded-[var(--radius-xl)] bg-gradient-to-r from-[var(--brand-blush)] to-[var(--brand-cream)] px-6 py-12 mb-8 text-center">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">{cat.name}</h1>
        <p className="text-sm text-[var(--muted)] mt-2">Delicate pieces for every little moment</p>
      </div>
      <nav className="text-sm text-[var(--muted)] mb-6">
        <Link href="/" className="hover:text-[var(--brand-pink)]">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/shop" className="hover:text-[var(--brand-pink)]">Shop</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--charcoal)]">{cat.name}</span>
      </nav>
      <p className="text-sm text-[var(--muted)] mb-6">{products.length} products</p>
      {products.length === 0 ? (
        <p className="text-center text-[var(--muted)] py-16">
          Products for this category will appear once added in admin.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
