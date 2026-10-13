import { notFound } from "next/navigation";
import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { category as categoryTable, product as productTable, productImage, review } from "@/lib/db/drizzle/schema";
import { formatPrice, formatDiscount } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { ProductImageGallery } from "@/components/product/product-image-gallery";
import { Truck } from "lucide-react";
import {
  applyAutomaticDiscounts,
  type AutomaticDiscountRule,
} from "@/lib/discounts/apply-automatic-discounts";
import { getActiveAutomaticDiscounts } from "@/lib/discounts/queries";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  try {
    const { db } = getDrizzleClient();
    const [foundProduct] = await db
      .select({
        name: productTable.name,
        seoTitle: productTable.seoTitle,
        seoDescription: productTable.seoDescription,
        description: productTable.description,
      })
      .from(productTable)
      .where(eq(productTable.slug, slug))
      .limit(1);
    if (!foundProduct) return { title: "Product" };
    return {
      title: foundProduct.seoTitle || foundProduct.name,
      description: foundProduct.seoDescription || foundProduct.description || undefined,
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  let product: (typeof productTable.$inferSelect & {
    images: (typeof productImage.$inferSelect)[];
    category: typeof categoryTable.$inferSelect | null;
    reviews: (typeof review.$inferSelect)[];
  }) | null = null;
  try {
    const { db } = getDrizzleClient();
    const [foundProduct] = await db
      .select()
      .from(productTable)
      .where(eq(productTable.slug, slug))
      .limit(1);
    if (foundProduct) {
      const [images, categories, reviews] = await Promise.all([
        db
          .select()
          .from(productImage)
          .where(eq(productImage.productId, foundProduct.id))
          .orderBy(asc(productImage.sortOrder)),
        foundProduct.categoryId
          ? db.select().from(categoryTable).where(eq(categoryTable.id, foundProduct.categoryId)).limit(1)
          : Promise.resolve([]),
        db
          .select()
          .from(review)
          .where(and(
            eq(review.productId, foundProduct.id),
            eq(review.status, "APPROVED"),
          ))
          .limit(10),
      ]);
      product = {
        ...foundProduct,
        images,
        category: categories[0] ?? null,
        reviews,
      };
    }
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
        <div className="grid items-start gap-8 md:grid-cols-2 lg:gap-12">
          <ProductImageGallery images={[]} productName={demo.name} />
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
            <div className="mt-8 space-y-2 text-sm text-[var(--muted)]">
              <p className="flex items-center gap-2">
                <Truck size={16} aria-hidden="true" />
                Delivery information available at checkout
              </p>
              <Link
                href="/return-policy"
                className="flex items-center gap-2 hover:text-[var(--brand-pink)]"
              >
                <span aria-hidden="true">↩</span>
                See our returns policy for exchange details
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const discountRules = (await getActiveAutomaticDiscounts()).map((rule) => ({
    ...rule,
    startsAt: rule.startsAt ? new Date(rule.startsAt) : null,
    endsAt: rule.endsAt ? new Date(rule.endsAt) : null,
  })) as AutomaticDiscountRule[];
  const basePrice = Number(product.salePrice ?? product.price);
  const automaticPrice = applyAutomaticDiscounts(
    [product],
    discountRules,
    basePrice,
  ).get(product.id);
  const effectivePrice = automaticPrice?.unitPrice ?? Number(product.salePrice ?? product.price);
  const onSale = effectivePrice < Number(product.price);
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

      <div className="grid items-start gap-8 md:grid-cols-2 lg:gap-12">
        <ProductImageGallery
          images={product.images.map((image) => ({
            id: image.id,
            src: image.url,
            alt: image.alt || product.name,
          }))}
          productName={product.name}
        />

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
              {formatPrice(effectivePrice)}
            </span>
            {onSale && (
              <>
                <span className="text-sm text-[var(--muted)] line-through">
                  {formatPrice(Number(product.price))}
                </span>
                <Badge variant="sale">
                  {formatDiscount(Number(product.price), effectivePrice)}% OFF
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
              salePrice: onSale ? effectivePrice : null,
              stockQuantity: product.stockQuantity,
              imageUrl: product.images[0]?.url || null,
            }}
            disabled={!inStock}
          />
          <div className="mt-8 space-y-2 text-sm text-[var(--muted)]">
            <p className="flex items-center gap-2">
              <Truck size={16} aria-hidden="true" />
              Delivery information available at checkout
            </p>
            <Link
              href="/return-policy"
              className="flex items-center gap-2 hover:text-[var(--brand-pink)]"
            >
              <span aria-hidden="true">↩</span>
              See our returns policy for exchange details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function cnStock(inStock: boolean) {
  return `text-sm mb-4 ${inStock ? "text-[var(--success)]" : "text-[var(--error)]"}`;
}
