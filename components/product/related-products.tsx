import { ProductCard, type ProductCardData } from "@/components/product/product-card";

export function RelatedProducts({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) return null;

  return (
    <section className="mt-8 border-t border-[var(--border)] pt-6 sm:mt-10 sm:pt-7" aria-labelledby="related-products-title">
      <div className="mb-3 sm:mb-4">
        <p className="section-label mb-1">A few more to love</p>
        <h2 id="related-products-title" className="font-display text-2xl font-medium text-[var(--charcoal)] sm:text-3xl">You may also like</h2>
      </div>
      <div className="related-products-track" aria-label="More products in this category">
        {products.map((product) => (
          <div className="related-products-slide" key={product.id}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
