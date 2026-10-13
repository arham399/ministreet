import { and, asc, count, desc, eq, gte, inArray, isNotNull, lte, ne, sql, sum } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { category, order, orderItem, product } from "@/lib/db/drizzle/schema";

export async function getDashboardStats(from?: Date, to?: Date) {
  const { db } = getDrizzleClient();
  const dateFilters = [
    ...(from ? [gte(order.createdAt, from)] : []),
    ...(to ? [lte(order.createdAt, to)] : []),
  ];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const notCancelled = ne(order.status, "CANCELLED");

  const [
    [todayOrders],
    [pendingOrders],
    [lowStock],
    [revenueAgg],
    [unitsAgg],
    [todayRevenue],
  ] = await Promise.all([
    db.select({ value: count() }).from(order).where(and(
      gte(order.createdAt, todayStart),
      notCancelled,
    )),
    db.select({ value: count() }).from(order).where(inArray(
      order.status,
      ["PLACED", "CONFIRMED", "PROCESSING", "PACKED"],
    )),
    db.select({ value: count() }).from(product).where(and(
      eq(product.isActive, true),
      lte(product.stockQuantity, 5),
    )),
    db.select({ total: sum(order.total), count: count() }).from(order).where(and(
      ...dateFilters,
      notCancelled,
    )),
    db.select({ quantity: sum(orderItem.quantity) })
      .from(orderItem)
      .innerJoin(order, eq(orderItem.orderId, order.id))
      .where(and(
        ...dateFilters,
        ne(order.status, "CANCELLED"),
      )),
    db.select({ total: sum(order.total) }).from(order).where(and(
      gte(order.createdAt, todayStart),
      notCancelled,
    )),
  ]);

  return {
    todayRevenue: Number(todayRevenue.total ?? 0),
    ordersToday: todayOrders.value,
    pendingOrders: pendingOrders.value,
    productsSold: Number(unitsAgg.quantity ?? 0),
    lowStock: lowStock.value,
    periodRevenue: Number(revenueAgg.total ?? 0),
    periodOrders: revenueAgg.count,
  };
}

export async function getOrdersByStatus() {
  const { db } = getDrizzleClient();
  const groups = await db
    .select({ status: order.status, count: count() })
    .from(order)
    .groupBy(order.status);
  return groups.map((group) => ({ status: group.status, count: group.count }));
}

export async function getTopProducts(limit = 10) {
  const { db } = getDrizzleClient();
  const top = await db
    .select({ productId: orderItem.productId, sold: sum(orderItem.quantity) })
    .from(orderItem)
    .where(isNotNull(orderItem.productId))
    .groupBy(orderItem.productId)
    .orderBy(desc(sum(orderItem.quantity)))
    .limit(limit);
  const productIds = top.flatMap((item) => item.productId ? [item.productId] : []);
  const products = productIds.length
    ? await db
      .select({ id: product.id, name: product.name, sku: product.sku })
      .from(product)
      .where(inArray(product.id, productIds))
    : [];
  const productById = new Map(products.map((item) => [item.id, item]));
  return top.map((item) => ({
    product: item.productId ? productById.get(item.productId) : undefined,
    sold: Number(item.sold ?? 0),
  }));
}

/** Last N days revenue for charts */
export async function getRevenueTimeSeries(days = 30) {
  const { db } = getDrizzleClient();
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  const orders = await db
    .select({ createdAt: order.createdAt, total: order.total })
    .from(order)
    .where(and(
      gte(order.createdAt, start),
      ne(order.status, "CANCELLED"),
    ))
    .orderBy(asc(order.createdAt));

  const byDay = new Map<string, number>();
  for (let i = 0; i <= days; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    byDay.set(date.toISOString().slice(0, 10), 0);
  }
  for (const currentOrder of orders) {
    const key = currentOrder.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) || 0) + Number(currentOrder.total));
  }

  return Array.from(byDay.entries()).map(([date, revenue]) => ({
    date,
    revenue: Math.round(revenue),
  }));
}

export async function getSalesByCategory() {
  const { db } = getDrizzleClient();
  const rows = await db
    .select({
      name: sql<string>`coalesce(${category.name}, 'Uncategorized')`,
      value: sum(orderItem.finalPrice),
    })
    .from(orderItem)
    .innerJoin(order, eq(orderItem.orderId, order.id))
    .leftJoin(product, eq(orderItem.productId, product.id))
    .leftJoin(category, eq(product.categoryId, category.id))
    .where(and(
      isNotNull(orderItem.productId),
      ne(order.status, "CANCELLED"),
    ))
    .groupBy(category.name);
  return rows
    .map((row) => ({ name: row.name, value: Math.round(Number(row.value ?? 0)) }))
    .sort((a, b) => b.value - a.value);
}
