import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { category, product as productsTable, productImage } from "@/lib/db/drizzle/schema";
import { ProductForm } from "@/components/admin/product-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  let product = null;
  let categories: { id: string; name: string }[] = [];
  try {
    const { db } = getDrizzleClient();
    const [productRows, categoryRows] = await Promise.all([
      db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1),
      db.select({ id: category.id, name: category.name }).from(category)
        .where(eq(category.isActive, true)).orderBy(asc(category.displayOrder)),
    ]);
    const images = productRows.length
      ? await db.select().from(productImage)
        .where(eq(productImage.productId, id)).orderBy(asc(productImage.sortOrder))
      : [];
    product = productRows[0] ? { ...productRows[0], images } : null;
    categories = categoryRows;
  } catch { /* */ }

  if (!product) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Edit Product</h1>
      <ProductForm
        categories={categories}
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          description: product.description,
          price: Number(product.price),
          salePrice: product.salePrice != null ? Number(product.salePrice) : null,
          stockQuantity: product.stockQuantity,
          lowStockThreshold: product.lowStockThreshold,
          isActive: product.isActive,
          isNewArrival: product.isNewArrival,
          isFeatured: product.isFeatured,
          categoryId: product.categoryId,
          imageUrls: product.images.map((i) => i.url),
        }}
      />
    </div>
  );
}
