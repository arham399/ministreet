import Link from "next/link";
import { and, asc, eq, isNull } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { category, product } from "@/lib/db/drizzle/schema";
import { DiscountCreateForm } from "@/components/admin/discount-create-form";

export const metadata = { title: "Add discount | Admin" };

export default async function NewDiscountPage() {
  const { db } = getDrizzleClient();
  const [products, categories] = await Promise.all([
    db.select({ id: product.id, name: product.name }).from(product)
      .where(and(eq(product.isActive, true), isNull(product.archivedAt))).orderBy(asc(product.name)),
    db.select({ id: category.id, name: category.name }).from(category)
      .where(eq(category.isActive, true)).orderBy(asc(category.name)),
  ]);
  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/discounts" className="mb-2 inline-block text-sm text-[var(--muted)] hover:text-[var(--brand-pink)]">
          ← Back to discounts
        </Link>
        <h1 className="text-xl font-semibold">Create an automatic discount</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Choose eligible products, set the offer, and customers will see the reduced prices automatically.
        </p>
      </div>
      <DiscountCreateForm products={products} categories={categories} />
    </div>
  );
}
