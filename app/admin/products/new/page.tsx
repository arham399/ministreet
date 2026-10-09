import { prisma } from "@/lib/db/prisma";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Add Product | Admin" };

export default async function NewProductPage() {
  let categories: { id: string; name: string }[] = [];
  try {
    categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      select: { id: true, name: true },
    });
  } catch { /* */ }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Add Product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
