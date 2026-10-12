import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Facebook, Instagram as InstagramIcon, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { CategoryCarousel } from "@/components/home/category-carousel";
import { PromoBannerCarousel } from "@/components/home/promo-banner-carousel";
import { getNewArrivals, getBestSellers } from "@/lib/db/queries/products";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_LINK, FACEBOOK_URL, INSTAGRAM_URL } from "@/lib/constants";

export default async function HomePage() {
  let newArrivals: Awaited<ReturnType<typeof getNewArrivals>>["products"] = [];
  let bestSellers: Awaited<ReturnType<typeof getBestSellers>>["products"] = [];

  try {
    const [na, bs] = await Promise.all([getNewArrivals(4), getBestSellers(4)]);
    newArrivals = na.products;
    bestSellers = bs.products;
  } catch {
    newArrivals = [
      { id: "1", name: "Pearl Drop Earrings", slug: "pearl-drop-earrings", price: 1599, salePrice: 1299, imageUrl: "", isNewArrival: true, stockQuantity: 25, averageRating: null, categorySlug: undefined },
      { id: "2", name: "Golden Heart Bracelet", slug: "golden-heart-bracelet", price: 1899, salePrice: 1499, imageUrl: "", isNewArrival: true, stockQuantity: 18, averageRating: null, categorySlug: undefined },
    ];
    bestSellers = newArrivals;
  }

  return (
    <>
      <section className="home-hero" aria-label="Mini Street jewelry collection">
        <Image
          src="/assets/categories/hero/ministreet-hero.png"
          alt="Mini Street — Adorably Enchanting Treasures"
          width={1600}
          height={515}
          priority
          sizes="100vw"
          className="hero-banner-image"
        />
      </section>

      <section className="category-section-wrap py-2 sm:py-4" aria-label="Shop by category">
        <div className="category-section-content mx-auto">
          <h2 className="mb-2 flex items-center gap-3 text-center font-display text-xl font-medium text-[var(--charcoal)] sm:mb-3 sm:gap-4 sm:text-2xl">
            <span className="h-0.5 flex-1 bg-[var(--brand-pink-soft)]" aria-hidden="true" />
            Shop by category
            <span className="h-0.5 flex-1 bg-[var(--brand-pink-soft)]" aria-hidden="true" />
          </h2>
          <CategoryCarousel />
        </div>
      </section>

      <PromoBannerCarousel />

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
          <div className="relative mb-7 text-center sm:mb-9">
            <p className="section-label mb-1.5">Fresh from the boutique</p><h2 className="font-display text-3xl font-medium text-[var(--charcoal)] sm:text-4xl">New arrivals</h2><p className="mt-1 text-xs text-[var(--muted)] sm:text-sm">Meet your next little treasure.</p>
            <Link href="/new-arrivals" className="link-premium absolute bottom-0 right-0 hidden items-center gap-1 text-xs font-medium text-[var(--brand-pink)] lg:inline-flex">View all <ArrowRight size={13} /></Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{newArrivals.map((p) => <ProductCard key={p.id} product={p} />)}</div>
          <div className="mt-7 text-center sm:hidden"><Button asChild variant="outline" size="sm"><Link href="/new-arrivals">View all new arrivals</Link></Button></div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
          <div className="editorial-panel relative flex min-h-[390px] items-end justify-center overflow-hidden rounded-[var(--radius-2xl)] px-5 pb-8 pt-56 sm:min-h-[430px] sm:px-10 sm:pb-10 lg:min-h-[390px] lg:items-center lg:justify-end lg:px-16 lg:py-14">
            <div className="editorial-decoration" aria-hidden="true"><span>✧</span><span>○</span><span>✦</span></div>
            <Image src="/assets/categories/homepage/sparkle/image.png" alt="Gold jewelry arranged on blush silk and natural stone" fill sizes="(max-width: 639px) 1px, (max-width: 1279px) 90vw, 1200px" className="editorial-image editorial-image-desktop" />
            <Image src="/assets/categories/homepage/sparkle/mobile/image.png" alt="Gold jewelry arranged on blush silk and natural stone" fill sizes="100vw" className="editorial-image editorial-image-mobile" />
            <div className="editorial-overlay" aria-hidden="true" />
            <div className="relative z-10 w-full max-w-lg text-center lg:text-left">
              <p className="section-label mb-3">A little something lovely</p>
              <h2 className="font-display mb-3 text-3xl font-medium leading-tight text-[var(--charcoal)] sm:text-4xl">Your everyday,<br /><i className="text-[var(--brand-pink-deep)]">with a little extra.</i></h2>
              <p className="mx-auto mb-6 max-w-sm text-sm leading-6 text-[var(--muted)] lg:mx-0">Thoughtful details, delicate shine, and pieces that feel just like you.</p>
              <Button asChild><Link href="/shop">Find your sparkle <ArrowRight size={16} /></Link></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
          <div className="relative mb-7 text-center sm:mb-9">
            <p className="section-label mb-1.5">The most-loved little things</p><h2 className="font-display text-3xl font-medium text-[var(--charcoal)] sm:text-4xl">Customer favorites</h2>
            <Link href="/best-sellers" className="link-premium absolute bottom-0 right-0 hidden items-center gap-1 text-xs font-medium text-[var(--brand-pink)] lg:inline-flex">View all <ArrowRight size={13} /></Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{bestSellers.map((p) => <ProductCard key={p.id} product={p} />)}</div>
          <div className="mt-7 text-center sm:hidden"><Button asChild variant="outline" size="sm"><Link href="/best-sellers">See all favorites</Link></Button></div>
        </div>
      </section>

      <section className="social-showcase relative overflow-hidden text-center" aria-labelledby="social-showcase-title">
        <div className="social-showcase-wash" aria-hidden="true" />
        <div className="social-showcase-content relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10 lg:py-12">
          <p className="section-label mb-1.5">Come say hello</p>
          <h2 id="social-showcase-title" className="font-display text-2xl font-medium text-[var(--charcoal)] sm:text-3xl">A little street full of sparkle.</h2>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-[var(--muted)] sm:text-sm">Let&apos;s stay connected. Discover your daily dose of style, shine, and little things you love.</p>

          <div className="social-contact-grid mx-auto mt-5 grid max-w-4xl grid-cols-2 gap-y-4 sm:mt-6 sm:grid-cols-4 sm:gap-0">
            <a href={`mailto:${CONTACT_EMAIL}`} className="social-contact-link group">
              <span className="social-contact-icon"><Mail size={18} /></span><span className="social-contact-email">{CONTACT_EMAIL}</span>
            </a>
            <a href={CONTACT_PHONE_LINK} className="social-contact-link group">
              <span className="social-contact-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20.5 11.5a8.4 8.4 0 0 1-12.4 7.4L4 20l1.1-4A8.4 8.4 0 1 1 20.5 11.5Z" />
                  <path d="M8.8 8.2c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.7c.1.2.1.4-.1.6l-.5.6c-.2.2-.2.4 0 .6.5.9 1.3 1.6 2.2 2.1.2.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.6.8c.3.1.4.3.3.6-.1.6-.5 1.1-1 1.4-.6.3-1.3.4-2 .2a8.9 8.9 0 0 1-3.4-1.9 8.4 8.4 0 0 1-2.3-3.1c-.3-.8-.2-1.6.2-2.2Z" />
                </svg>
              </span>
              <span>{CONTACT_PHONE}</span>
            </a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="social-contact-link group">
              <span className="social-contact-icon"><InstagramIcon size={18} /></span><span>Instagram</span>
            </a>
            <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="social-contact-link group">
              <span className="social-contact-icon"><Facebook size={18} /></span><span>Facebook</span>
            </a>
          </div>

          <div className="social-gallery-wrap mx-auto mt-6 max-w-[520px] sm:mt-7">
            <div className="social-gallery-heading"><span />Follow our little world<span /></div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { src: "/assets/categories/homepage/social_media/photo-1.png", alt: "Gold jewelry styled with flowers and blush silk" },
                { src: "/assets/categories/homepage/social_media/photo-2.png", alt: "Gold necklace and earrings worn together" },
                { src: "/assets/categories/homepage/social_media/photo-3.png", alt: "Mini Street gift box with gold jewelry" },
              ].map((photo) => (
                <div key={photo.src} className="social-gallery-photo">
                  <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 639px) 30vw, 170px" className="object-cover" />
                </div>
              ))}
            </div>
          </div>

          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="social-follow-button mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--brand-pink)] px-5 py-2.5 text-xs font-medium text-white shadow-soft transition hover:bg-[var(--brand-pink-deep)] sm:mt-6 sm:px-6 sm:py-3 sm:text-sm">
            <InstagramIcon size={16} /> Follow us on Instagram <ArrowRight size={15} />
          </a>
          <div className="social-question mt-3 flex items-center justify-center gap-2.5 text-[10px] text-[var(--muted)] sm:text-xs"><span />Questions? <a href={`mailto:${CONTACT_EMAIL}`} className="link-premium">{CONTACT_EMAIL}</a><span /></div>
        </div>
      </section>
    </>
  );
}
