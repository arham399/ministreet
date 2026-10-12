import Link from "next/link";
import { Gift, Heart, PackageCheck, Sparkles } from "lucide-react";
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
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Sparkles, title: "Chosen with care", desc: "Thoughtfully selected pieces for everyday sparkle." },
              { icon: Heart, title: "Made to feel special", desc: "Little details that feel personal and lovely." },
              { icon: PackageCheck, title: "Packed with love", desc: "Every order prepared with care." },
              { icon: Gift, title: "Lovely to gift", desc: "A little joy to share with someone dear." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 rounded-2xl border border-[var(--border)]/70 bg-white/75 p-4 shadow-soft">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-blush)] text-[var(--brand-pink)]"><Icon size={17} strokeWidth={1.7} /></span>
                <span><strong className="block text-sm font-semibold text-[var(--charcoal)]">{title}</strong><span className="mt-1 block text-xs leading-relaxed text-[var(--muted)]">{desc}</span></span>
              </div>
            ))}
          </div>
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
