import { prisma } from "@/lib/db/prisma";

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
    products = await prisma.product.findMany({
      where: { archivedAt: null, trackInventory: true },
      orderBy: { stockQuantity: "asc" },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        reservedStock: true,
        lowStockThreshold: true,
      },
    });
  } catch { /* */ }

  const totalStock = products.reduce((s, p) => s + p.stockQuantity, 0);
  const low = products.filter((p) => p.stockQuantity <= p.lowStockThreshold).length;
  const out = products.filter((p) => p.stockQuantity <= 0).length;

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Inventory</h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4">
          <p className="text-xs text-[var(--muted)]">Total units</p>
          <p className="text-xl font-semibold">{totalStock}</p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4">
          <p className="text-xs text-[var(--muted)]">Low stock</p>
          <p className="text-xl font-semibold">{low}</p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4">
          <p className="text-xs text-[var(--muted)]">Out of stock</p>
          <p className="text-xl font-semibold">{out}</p>
        </div>
      </div>
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white overflow-x-auto">
        <table className="w-full text-sm">
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
