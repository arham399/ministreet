import { and, asc, eq, isNull } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { product } from "@/lib/db/drizzle/schema";

export const metadata = { title: "Inventory | Admin" };

export default async function InventoryPage() {
  let products: {
    id: string;
    name: string;
    sku: string;
    stockQuantity: number;
    reservedStock: number;
    lowStockThreshold: number;
  }[] = [];
  try {
    const { db } = getDrizzleClient();
    products = await db.select({
        id: product.id,
        name: product.name,
        sku: product.sku,
        stockQuantity: product.stockQuantity,
        reservedStock: product.reservedStock,
        lowStockThreshold: product.lowStockThreshold,
      }).from(product)
      .where(and(isNull(product.archivedAt), eq(product.trackInventory, true)))
      .orderBy(asc(product.stockQuantity));
  } catch { /* */ }

  const totalStock = products.reduce((s, p) => s + p.stockQuantity, 0);
  const low = products.filter((p) => p.stockQuantity <= p.lowStockThreshold).length;
  const out = products.filter((p) => p.stockQuantity <= 0).length;

  return (
    <div>
      <h1 className="mb-5 text-xl font-semibold sm:mb-6">Inventory</h1>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-3 sm:p-4">
          <p className="text-xs text-[var(--muted)]">Total units</p>
          <p className="text-xl font-semibold">{totalStock}</p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-3 sm:p-4">
          <p className="text-xs text-[var(--muted)]">Low stock</p>
          <p className="text-xl font-semibold">{low}</p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-3 sm:p-4">
          <p className="text-xs text-[var(--muted)]">Out of stock</p>
          <p className="text-xl font-semibold">{out}</p>
        </div>
      </div>
      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-white">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const available = p.stockQuantity - p.reservedStock;
              const status =
                p.stockQuantity <= 0
                  ? "Out"
                  : p.stockQuantity <= p.lowStockThreshold
                    ? "Low"
                    : "OK";
              return (
                <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{p.sku}</td>
                  <td className="px-4 py-3">{p.stockQuantity}</td>
                  <td className="px-4 py-3">{available}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        status === "Out"
                          ? "bg-red-50 text-red-700"
                          : status === "Low"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-green-50 text-green-700"
                      }`}
                    >
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
