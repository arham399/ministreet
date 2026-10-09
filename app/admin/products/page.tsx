import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Products | Admin" };

export default async function AdminProductsPage() {
  let products: {
    id: string;
    name: string;
    sku: string;
    price: unknown;
    salePrice: unknown;
    stockQuantity: number;
    isActive: boolean;
  }[] = [];
  try {
    products = await prisma.product.findMany({
      where: { archivedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  } catch { /* */ }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Products</h1>
        <Button asChild size="sm">
          <Link href="/admin/products/new">+ Add Product</Link>
        </Button>
      </div>
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white overflow-x-auto shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)]">
                  No products. <Link href="/admin/products/new" className="text-[var(--brand-pink)]">Add one</Link>
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--brand-cream)]">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{p.sku}</td>
                  <td className="px-4 py-3">
                    {formatPrice(Number(p.salePrice ?? p.price))}
                    {p.salePrice != null && (
                      <span className="text-xs text-[var(--muted)] line-through ml-1">
                        {formatPrice(Number(p.price))}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{p.stockQuantity}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${p.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="text-[var(--brand-pink)] hover:underline text-xs">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
