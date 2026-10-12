"use client";

import { useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

type GalleryImage = {
  id: string;
  src: string;
  alt: string;
};

type ProductImageGalleryProps = {
  images: GalleryImage[];
  productName: string;
};

function ImagePlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[var(--brand-blush)] text-[var(--muted)]">
      Product image
    </div>
  );
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = images[selectedIndex];

  return (
    <Dialog.Root>
      <div className="space-y-3">
        <Dialog.Trigger asChild>
          <button
            type="button"
            aria-label={`View ${productName} image full screen`}
            className="relative block h-[min(55svh,460px)] w-full overflow-hidden rounded-[var(--radius-lg)] bg-[var(--brand-cream)] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)] sm:h-[min(60svh,520px)] lg:h-[min(62vh,600px)]"
          >
            {selectedImage ? (
              <Image
                src={selectedImage.src}
                alt={selectedImage.alt || productName}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={selectedIndex === 0}
              />
            ) : (
              <ImagePlaceholder />
            )}
          </button>
        </Dialog.Trigger>

        {images.length > 1 && (
          <div>
            <p className="mb-2 text-xs text-[var(--muted)]">
              More photos · swipe or scroll
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                aria-label={`View ${productName} image ${index + 1}`}
                aria-pressed={selectedIndex === index}
                onClick={() => setSelectedIndex(index)}
                className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border ${
                  selectedIndex === index
                    ? "border-[var(--brand-pink)] ring-1 ring-[var(--brand-pink)]"
                    : "border-[var(--border)]"
                }`}
              >
                <Image
                  src={image.src}
                  alt={image.alt || ""}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
            </div>
          </div>
        )}
      </div>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/90 data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content className="fixed inset-0 z-[101] flex items-center justify-center p-4 focus:outline-none sm:p-8">
          <Dialog.Title className="sr-only">{productName} image</Dialog.Title>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close full-screen image"
              className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2.5 text-[var(--charcoal)] shadow-soft transition-colors hover:bg-white sm:right-6 sm:top-6"
            >
              <X size={22} />
            </button>
          </Dialog.Close>
          {selectedImage ? (
            <Image
              src={selectedImage.src}
              alt={selectedImage.alt || productName}
              fill
              className="object-contain p-4 sm:p-8"
              sizes="100vw"
              priority
            />
          ) : (
            <div className="relative h-[min(80vh,600px)] w-full max-w-2xl overflow-hidden rounded-[var(--radius-lg)]">
              <ImagePlaceholder />
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
