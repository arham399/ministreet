"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";

const reviews = [
  { quote: "The rings are so trendy and beautiful. Thank you so much!", detail: "About the rings" },
  { quote: "I’m loving the jewellery and quality. It’s absolutely stunning—my new favourite jewellery!", detail: "About the jewellery" },
  { quote: "The bracelets are absolutely stunning and the quality is top-tier. So elegant and comfortable to wear. Fully recommended!", detail: "About the bracelet set" },
  { quote: "Your ring bracelet is so pretty with my Kashmiri churi. Thank you!", detail: "About the ring bracelet" },
  { quote: "Ordered this wonderful jewellery and absolutely loving it. Will definitely buy again!", detail: "A returning customer" },
  { quote: "Parcel received—MashaAllah, the jewellery is lovely. Jazakillah.", detail: "Parcel feedback" },
  { quote: "Loved the elegant design and quality of the finger chain set! Delivery was quick, and it looks even more beautiful in person.", detail: "About the finger chain set" },
  { quote: "Absolutely in love with this bracelet set. Quality, finishing and detailing are on point! Highly recommended.", detail: "About the bracelet set" },
  { quote: "I’ve been wearing these bracelets all week. The colours haven’t faded. Love the quality!", detail: "About the bracelets" },
  { quote: "Loved my bracelet, and the free hoops made my day! Amazing quality and super cute packaging, too.", detail: "About the order" },
  { quote: "I was a bit hesitant before ordering, but I loved everything when my parcel arrived. The quality is amazing for the price!", detail: "First order experience" },
];

export function CustomerReviewsCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [indicatorWidth, setIndicatorWidth] = useState(28);

  const updateControls = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const scrollRange = track.scrollWidth - track.clientWidth;
    setScrollProgress(scrollRange > 0 ? Math.min(100, (track.scrollLeft / scrollRange) * 100) : 0);
    setIndicatorWidth(track.scrollWidth > 0 ? Math.min(100, (track.clientWidth / track.scrollWidth) * 100) : 100);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateControls();
    const observer = new ResizeObserver(updateControls);
    observer.observe(track);
    return () => observer.disconnect();
  }, [updateControls]);

  return (
    <div>
      <div
        ref={trackRef}
        className="customer-reviews-track"
        onScroll={updateControls}
        tabIndex={0}
        aria-label="Customer reviews. Swipe or scroll horizontally to read more."
        aria-roledescription="carousel"
      >
        {reviews.map((review) => (
          <figure key={review.quote} className="customer-reviews-slide group flex flex-col rounded-xl border border-[var(--border)] bg-white p-3.5 shadow-[0_5px_18px_rgba(54,34,46,0.04)] transition-shadow duration-200 hover:shadow-[0_10px_26px_rgba(54,34,46,0.08)] sm:rounded-2xl sm:p-4">
            <div className="mb-1.5 flex gap-1 text-[var(--brand-gold)]" aria-hidden="true">
              {Array.from({ length: 5 }, (_, starIndex) => <Star key={starIndex} className="h-3 w-3 fill-current" />)}
            </div>
            <blockquote className="flex-1 text-[13px] leading-5 text-[var(--charcoal)] sm:text-sm sm:leading-[1.4rem]">“{review.quote}”</blockquote>
            <figcaption className="mt-3 flex min-w-0 items-center gap-2 border-t border-[var(--border)] pt-2 text-[10px] text-[var(--muted)] sm:text-[11px]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-pink)]" aria-hidden="true" />
              <span className="truncate font-medium uppercase tracking-[0.1em] text-[var(--brand-pink-deep)]">Customer note</span>
              <span className="truncate">{review.detail}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="mt-3 flex h-2 items-center justify-center">
        <div className="customer-reviews-indicator" role="progressbar" aria-label="Review carousel position" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(scrollProgress)}>
          <span style={{ width: `${indicatorWidth}%`, left: `${(scrollProgress * (100 - indicatorWidth)) / 100}%` }} />
        </div>
      </div>
    </div>
  );
}
