import { notFound } from "next/navigation";
import { and, asc, eq, isNull } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { category, product as productsTable, productImage } from "@/lib/db/drizzle/schema";
import { ProductForm } from "@/components/admin/product-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  let product = null;
  let categories: { id: string; name: string }[] = [];
  let productChoices: { id: string; name: string; sku: string; colorGroupId: string | null }[] = [];
  let colorOptions: { productId: string; name: string; hex: string }[] = [];
  try {
    const { db } = getDrizzleClient();
    const [productRows, categoryRows, productChoiceRows] = await Promise.all([
      db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1),
      db.select({ id: category.id, name: category.name }).from(category)
        .where(eq(category.isActive, true)).orderBy(asc(category.displayOrder)),
      db.select({
        id: productsTable.id,
        name: productsTable.name,
        sku: productsTable.sku,
        colorGroupId: productsTable.colorGroupId,
      }).from(productsTable)
        .where(and(eq(productsTable.isActive, true), isNull(productsTable.archivedAt)))
        .orderBy(asc(productsTable.name)),
    ]);
    const images = productRows.length
      ? await db.select().from(productImage)
        .where(eq(productImage.productId, id)).orderBy(asc(productImage.sortOrder))
      : [];
    product = productRows[0] ? { ...productRows[0], images } : null;
    categories = categoryRows;
    const current = productRows[0];
    const groupId = current?.colorGroupId;
    productChoices = productChoiceRows.filter((choice) => !choice.colorGroupId || choice.colorGroupId === groupId);
    if (groupId) {
      const groupProducts = await db.select({
        id: productsTable.id,
        name: productsTable.colorName,
        hex: productsTable.colorHex,
      }).from(productsTable)
        .where(eq(productsTable.colorGroupId, groupId))
        .orderBy(asc(productsTable.createdAt));
      colorOptions = groupProducts.map((option) => ({
        productId: option.id,
        name: option.name || "",
        hex: option.hex || "#d4af37",
      })).sort((a, b) => Number(b.productId === groupId) - Number(a.productId === groupId));
    }
  } catch { /* */ }

  if (!product) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Edit Product</h1>
      <ProductForm
        categories={categories}
        productChoices={productChoices}
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
          colorGroupId: product.colorGroupId,
          colorName: product.colorName,
          colorHex: product.colorHex,
          colorOptions,
        }}
      />
    </div>
  );
}
