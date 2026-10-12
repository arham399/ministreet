"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const banners = [
  {
    src: "/assets/categories/homepage/banner-1-beige-1920.png",
    mobileSrc: "/assets/categories/homepage/mobile/mobile-1-beige-800x800.webp",
    alt: "Fine jewelry for every you, with a model wearing gold jewelry",
  },
  {
    src: "/assets/categories/homepage/banner-2-green-1920.png",
    mobileSrc: "/assets/categories/homepage/mobile/mobile-2-green-800x800.webp",
    alt: "Modern heritage, jewelry for generations, with a model wearing gold jewelry",
  },
  {
    src: "/assets/categories/homepage/banner-3-black-1920.png",
    mobileSrc: "/assets/categories/homepage/mobile/mobile-3-black-800x800.webp",
    alt: "Jewelry portraits in a warm, dark editorial setting",
  },
];

export function PromoBannerCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % banners.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="promo-banner-carousel" aria-label="Featured collections" aria-roledescription="carousel">
      {banners.map((banner, index) => (
        <div key={banner.src} className={`promo-banner-slide${index === activeIndex ? " is-active" : ""}`} aria-hidden={index !== activeIndex}>
          <Image
            src={banner.src}
            alt={banner.alt}
            width={1920}
            height={362}
            sizes="100vw"
            priority={index === 0}
            className="promo-banner-image"
          />
          <Image
            src={banner.mobileSrc}
            alt={banner.alt}
            width={800}
            height={800}
            sizes="(max-width: 767px) 100vw, 1px"
            className="promo-banner-mobile-image"
          />
        </div>
      ))}
    </section>
  );
}
