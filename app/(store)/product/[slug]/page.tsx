import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db/prisma";
import { formatPrice, formatDiscount } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/product/add-to-cart-button";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  try {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) return { title: "Product" };
    return {
      title: product.seoTitle || product.name,
      description: product.seoDescription || product.description || undefined,
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  let product = null;
  try {
    product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        category: true,
        reviews: { where: { status: "APPROVED" }, take: 10 },
      },
    });
  } catch {
    // DB offline
  }

  // Demo fallback when no DB
  if (!product) {
    const demos: Record<string, { name: string; price: number; salePrice: number; desc: string }> = {
      "pearl-drop-earrings": {
        name: "Pearl Drop Earrings",
        price: 1599,
        salePrice: 1299,
        desc: "Elegant pearl drop earrings with a soft golden finish. Perfect for everyday sparkle.",
      },
      "golden-heart-bracelet": {
        name: "Golden Heart Bracelet",
        price: 1899,
        salePrice: 1499,
        desc: "A delicate golden heart bracelet that adds charm to any wrist.",
      },
    };
    const demo = demos[slug];
    if (!demo) notFound();

    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-sm text-[var(--muted)] mb-6">
          <Link href="/" className="hover:text-[var(--brand-pink)]">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/shop" className="hover:text-[var(--brand-pink)]">Shop</Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--charcoal)]">{demo.name}</span>
        </nav>
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="aspect-[4/5] rounded-[var(--radius-lg)] bg-[var(--brand-blush)] flex items-center justify-center text-[var(--muted)]">
            Product image
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold mb-2">{demo.name}</h1>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-xl font-semibold">{formatPrice(demo.salePrice)}</span>
              <span className="text-sm text-[var(--muted)] line-through">{formatPrice(demo.price)}</span>
              <Badge variant="sale">{formatDiscount(demo.price, demo.salePrice)}% OFF</Badge>
            </div>
            <p className="text-sm text-[var(--success)] mb-4">● In Stock</p>
            <p className="text-[var(--muted)] mb-6 leading-relaxed">{demo.desc}</p>
            <AddToCartButton
              product={{
                productId: slug,
                slug,
                name: demo.name,
                unitPrice: demo.price,
                salePrice: demo.salePrice,
                stockQuantity: 10,
                imageUrl: null,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  const onSale =
    product.salePrice != null && Number(product.salePrice) < Number(product.price);
  const inStock = product.stockQuantity > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-[var(--muted)] mb-6">
        <Link href="/" className="hover:text-[var(--brand-pink)]">Home</Link>
        <span className="mx-2">/</span>
        {product.category && (
          <>
            <Link href={`/shop/${product.category.slug}`} className="hover:text-[var(--brand-pink)]">
              {product.category.name}
            </Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-[var(--charcoal)]">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-3">
          <div className="relative aspect-[4/5] rounded-[var(--radius-lg)] overflow-hidden bg-[var(--brand-cream)]">
            {product.images[0] ? (
              <Image
                src={product.images[0].url}
                alt={product.images[0].alt || product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[var(--muted)]">
                No image
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img) => (
                <div
                  key={img.id}
                  className="relative w-16 h-20 shrink-0 rounded-[var(--radius-sm)] overflow-hidden border border-[var(--border)]"
                >
                  <Image src={img.url} alt={img.alt || ""} fill className="object-cover" sizes="64px" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="font-display text-3xl font-semibold mb-2">{product.name}</h1>
          {product.reviews.length > 0 && (
            <p className="text-sm text-[var(--muted)] mb-3">
              ★{" "}
              {(
                product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
              ).toFixed(1)}{" "}
              ({product.reviews.length} reviews)
            </p>
          )}
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-xl font-semibold">
              {formatPrice(onSale ? Number(product.salePrice) : Number(product.price))}
            </span>
            {onSale && (
              <>
                <span className="text-sm text-[var(--muted)] line-through">
                  {formatPrice(Number(product.price))}
                </span>
                <Badge variant="sale">
                  {formatDiscount(Number(product.price), Number(product.salePrice))}% OFF
                </Badge>
              </>
            )}
          </div>
          <p className={cnStock(inStock)}>
            {inStock ? "● In Stock" : "● Sold Out"}
          </p>
          {product.description && (
            <p className="text-[var(--muted)] my-6 leading-relaxed">{product.description}</p>
          )}
          <AddToCartButton
            product={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              unitPrice: Number(product.price),
              salePrice: product.salePrice != null ? Number(product.salePrice) : null,
              stockQuantity: product.stockQuantity,
              imageUrl: product.images[0]?.url || null,
            }}
            disabled={!inStock}
          />
          <div className="mt-8 space-y-2 text-sm text-[var(--muted)]">
            <p>🚚 Delivery information available at checkout</p>
            <p>↩ See our returns policy for exchange details</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function cnStock(inStock: boolean) {
  return `text-sm mb-4 ${inStock ? "text-[var(--success)]" : "text-[var(--error)]"}`;
}
