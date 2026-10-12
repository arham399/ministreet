import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { DiscountCreateForm } from "@/components/admin/discount-create-form";

export const metadata = { title: "Add discount | Admin" };

export default async function NewDiscountPage() {
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
