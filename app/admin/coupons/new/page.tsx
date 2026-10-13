import Link from "next/link";
import { and, asc, eq, isNull } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { category, product } from "@/lib/db/drizzle/schema";
import CouponCreateForm from "@/components/admin/coupon-create-form";

export const metadata = { title: "Add coupon | Admin" };

export default async function NewCouponPage() {
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
        <Link href="/admin/coupons" className="mb-2 inline-block text-sm text-[var(--muted)] hover:text-[var(--brand-pink)]">
          ← Back to coupons
        </Link>
        <h1 className="text-xl font-semibold">Add coupon</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Set the discount and any optional eligibility or usage restrictions.
        </p>
      </div>
      <CouponCreateForm
        products={products}
        categories={categories}
      />
    </div>
  );
}
