import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { CATEGORIES } from "@/lib/constants";
import { getNewArrivals, getBestSellers } from "@/lib/db/queries/products";

export default async function HomePage() {
  let newArrivals: Awaited<ReturnType<typeof getNewArrivals>>["products"] = [];
  let bestSellers: Awaited<ReturnType<typeof getBestSellers>>["products"] = [];

  try {
    const [na, bs] = await Promise.all([getNewArrivals(4), getBestSellers(4)]);
    newArrivals = na.products;
    bestSellers = bs.products;
  } catch {
    newArrivals = [
      { id: "1", name: "Pearl Drop Earrings", slug: "pearl-drop-earrings", price: 1599, salePrice: 1299, imageUrl: null, isNewArrival: true, stockQuantity: 25, averageRating: null },
      { id: "2", name: "Golden Heart Bracelet", slug: "golden-heart-bracelet", price: 1899, salePrice: 1499, imageUrl: null, isNewArrival: true, stockQuantity: 18, averageRating: null },
    ];
    bestSellers = newArrivals;
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-cream)] via-[var(--brand-blush)]/60 to-[var(--brand-teal-soft)]/40" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[var(--brand-pink-soft)]/30 to-transparent hidden lg:block" />
        {/* Decorative dots */}
        <div className="pointer-events-none absolute top-16 right-[12%] text-[var(--brand-gold)] opacity-60 text-lg hidden md:block" aria-hidden>✦</div>
        <div className="pointer-events-none absolute bottom-24 right-[22%] text-[var(--brand-pink)] opacity-30 text-sm hidden md:block" aria-hidden>✦</div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-xl animate-fade-up">
            <p className="section-label mb-5">Mini Street</p>
            <h1 className="font-display text-[2.5rem] sm:text-5xl lg:text-[3.5rem] font-semibold leading-[1.12] text-[var(--charcoal)] mb-6">
              Adorably Enchanting Treasures
            </h1>
            <p className="text-[15px] sm:text-base text-[var(--muted)] mb-9 max-w-md leading-relaxed">
              Little details. Beautiful moments. Jewelry and accessories chosen to make every look feel a little more special.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/shop">Shop Collection</Link>
              </Button>
              <Button asChild variant="soft" size="lg">
                <Link href="/new-arrivals">New Arrivals</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-label mb-3">Discover</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--charcoal)]">
              Shop by Category
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {CATEGORIES.map((cat, i) => (
              <Link
                key={cat.slug}
                href={`/shop/${cat.slug}`}
                className="group relative aspect-[4/5] rounded-[var(--radius-xl)] overflow-hidden bg-gradient-to-br from-[var(--brand-blush)] to-[var(--brand-cream-dark)] border border-[var(--border)]/60 shadow-soft hover:shadow-soft-md transition-all duration-400"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl opacity-20 group-hover:opacity-30 transition-opacity group-hover:scale-110 duration-500">
                    ✦
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--charcoal)]/50 via-[var(--charcoal)]/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                  <p className="text-white font-medium text-sm sm:text-base tracking-wide">
                    {cat.name}
                  </p>
                  <span className="text-white/70 text-xs mt-0.5 inline-flex items-center gap-1 group-hover:gap-2 transition-all duration-300">
                    Explore <span aria-hidden>→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── New Arrivals ── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="section-label mb-2">Just in</p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--charcoal)]">
                New Arrivals
              </h2>
              <p className="text-sm text-[var(--muted)] mt-1.5">
                Meet the latest little treasures.
              </p>
            </div>
            <Link
              href="/new-arrivals"
              className="hidden sm:inline text-sm font-medium text-[var(--brand-pink)] link-premium"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Button asChild variant="outline" size="sm">
              <Link href="/new-arrivals">View all new arrivals</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Editorial banner ── */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-[var(--radius-2xl)] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-pink-soft)] via-[var(--brand-blush)] to-[var(--brand-teal-soft)]" />
            <div className="relative py-16 sm:py-24 px-8 text-center">
              <p className="section-label mb-4">Everyday sparkle</p>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-[var(--charcoal)] mb-4">
                Your Everyday Sparkle
              </h2>
              <p className="text-[var(--muted)] mb-8 max-w-md mx-auto text-[15px]">
                Pieces made to complement every mood — delicate, wearable, and made to gift.
              </p>
              <Button asChild size="lg">
                <Link href="/shop">Shop Jewelry</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Best Sellers ── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="section-label mb-2">Favorites</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--charcoal)]">
              Loved by Mini Street Girls
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {bestSellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button asChild variant="outline">
              <Link href="/best-sellers">See all best sellers</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Why Mini Street ── */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="section-label mb-2">Our promise</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--charcoal)]">
              Why Mini Street
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10">
            {[
              { icon: "✧", title: "Carefully Selected", desc: "Every piece chosen with care for quality and style." },
              { icon: "✦", title: "Beautiful Details", desc: "Delicate finishes that make every look special." },
              { icon: "♡", title: "Secure Packaging", desc: "Your treasures arrive safely, gift-ready." },
              { icon: "❀", title: "Made to Gift", desc: "Perfect for treating yourself or someone you love." },
            ].map((item) => (
              <div key={item.title} className="text-center group">
                <div className="mx-auto w-14 h-14 rounded-full bg-[var(--brand-blush)] flex items-center justify-center text-[var(--brand-pink)] mb-5 text-lg group-hover:scale-105 transition-transform duration-300 shadow-soft">
                  {item.icon}
                </div>
                <h3 className="font-medium text-[var(--charcoal)] mb-1.5 text-sm sm:text-base">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed max-w-[200px] mx-auto">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Instagram ── */}
      <section className="py-16 border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="section-label mb-2">Community</p>
          <h2 className="font-display text-3xl font-semibold text-[var(--charcoal)] mb-2">
            Follow Our Little Street
          </h2>
          <a
            href="https://instagram.com/mini_street.co"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--brand-pink)] font-medium text-sm link-premium"
          >
            @mini_street.co
          </a>
        </div>
      </section>
    </>
  );
}
