import { asc, eq } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { category } from "@/lib/db/drizzle/schema";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Add Product | Admin" };

export default async function NewProductPage() {
  let categories: { id: string; name: string }[] = [];
  try {
    const { db } = getDrizzleClient();
    categories = await db.select({ id: category.id, name: category.name })
      .from(category)
      .where(eq(category.isActive, true))
      .orderBy(asc(category.displayOrder));
  } catch { /* */ }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Add Product</h1>
      <p className="mb-5 max-w-2xl text-sm text-[var(--muted)]">
        To offer colors, create a listing for each color with its own SKU, photos, and stock. Then edit one listing to link them as color options.
      </p>
      <ProductForm categories={categories} />
    </div>
  );
}
