import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import CouponCreateForm from "@/components/admin/coupon-create-form";

export const metadata = { title: "Add coupon | Admin" };

export default async function NewCouponPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
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
