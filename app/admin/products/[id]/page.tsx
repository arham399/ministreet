import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ProductForm } from "@/components/admin/product-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  let product = null;
  let categories: { id: string; name: string }[] = [];
  try {
    [product, categories] = await Promise.all([
      prisma.product.findUnique({
        where: { id },
        include: { images: { orderBy: { sortOrder: "asc" } } },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
        select: { id: true, name: true },
      }),
    ]);
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
