import { prisma } from "@/lib/db/prisma";

export async function getDashboardStats(from?: Date, to?: Date) {
  const dateFilter =
    from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {};

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [todayOrders, pendingOrders, lowStock, revenueAgg, unitsAgg, todayRevenue] =
    await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: todayStart }, status: { not: "CANCELLED" } },
      }),
      prisma.order.count({
        where: {
          status: { in: ["PLACED", "CONFIRMED", "PROCESSING", "PACKED"] },
        },
      }),
      prisma.product.count({
        where: { isActive: true, stockQuantity: { lte: 5 } },
      }),
      prisma.order.aggregate({
        where: { ...dateFilter, status: { not: "CANCELLED" } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.orderItem.aggregate({
        where: { order: { ...dateFilter, status: { not: "CANCELLED" } } },
        _sum: { quantity: true },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: todayStart },
          status: { not: "CANCELLED" },
        },
        _sum: { total: true },
      }),
    ]);

  return {
    todayRevenue: Number(todayRevenue._sum.total ?? 0),
    ordersToday: todayOrders,
    pendingOrders,
    productsSold: unitsAgg._sum.quantity ?? 0,
    lowStock,
    periodRevenue: Number(revenueAgg._sum.total ?? 0),
    periodOrders: revenueAgg._count,
  };
}

export async function getOrdersByStatus() {
  const groups = await prisma.order.groupBy({
    by: ["status"],
    _count: true,
  });
  return groups.map((g) => ({ status: g.status, count: g._count }));
}

export async function getTopProducts(limit = 10) {
  const top = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
    where: { productId: { not: null } },
  });
  const products = await prisma.product.findMany({
    where: { id: { in: top.map((t) => t.productId!).filter(Boolean) } },
    select: { id: true, name: true, sku: true },
  });
  const map = new Map(products.map((p) => [p.id, p]));
  return top.map((t) => ({
    product: map.get(t.productId!),
    sold: t._sum.quantity ?? 0,
  }));
}

/** Last N days revenue for charts */
export async function getRevenueTimeSeries(days = 30) {
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: start },
      status: { not: "CANCELLED" },
    },
    select: { createdAt: true, total: true },
    orderBy: { createdAt: "asc" },
  });

  const byDay = new Map<string, number>();
  for (let i = 0; i <= days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) || 0) + Number(o.total));
  }

  return Array.from(byDay.entries()).map(([date, revenue]) => ({
    date,
    revenue: Math.round(revenue),
  }));
}

export async function getSalesByCategory() {
  const items = await prisma.orderItem.findMany({
    where: {
      productId: { not: null },
      order: { status: { not: "CANCELLED" } },
    },
    select: {
      quantity: true,
      finalPrice: true,
      product: { select: { category: { select: { name: true } } } },
    },
  });

  const map = new Map<string, number>();
  for (const item of items) {
    const name = item.product?.category?.name || "Uncategorized";
    map.set(name, (map.get(name) || 0) + Number(item.finalPrice));
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);
}
