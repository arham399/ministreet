import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "About Mini Street" };

export default function AboutPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-[var(--brand-cream)] via-[var(--brand-blush)] to-[var(--brand-cream-dark)] py-20 px-4 text-center">
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[var(--charcoal)] mb-4">
          Little treasures. Big feelings.
        </h1>
        <p className="text-[var(--muted)] max-w-lg mx-auto">
          Mini Street is a feminine jewelry and accessories brand made for everyday sparkle.
        </p>
      </section>
      <section className="mx-auto max-w-3xl px-4 py-16 space-y-8 text-[var(--muted)] leading-relaxed">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--charcoal)] mb-3">Our Story</h2>
          <p>
            Mini Street was created for those who love delicate details — pieces that feel special without trying too hard.
            From earrings to bracelets, necklaces to combo sets, every item is chosen to add a little magic to your day.
          </p>
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--charcoal)] mb-3">What We Believe</h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>Beauty lives in the little things</li>
            <li>Jewelry should feel personal and wearable</li>
            <li>Gifting should be easy and thoughtful</li>
            <li>Quality and care in every package</li>
          </ul>
        </div>
        <div className="pt-4 text-center">
          <Button asChild size="lg">
            <Link href="/shop">Shop Mini Street</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
