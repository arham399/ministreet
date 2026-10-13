import { NextRequest, NextResponse } from "next/server";
import { auth, isAdminRole } from "@/lib/auth/config";
import { and, count, desc, eq, inArray, like, or } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { order, orderItem } from "@/lib/db/drizzle/schema";
import type { OrderStatus } from "@/lib/orders/status-transitions";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const q = sp.get("q");
  const page = Number(sp.get("page") || 1);
  const limit = 20;

  const escapedQuery = q?.replace(/[\\%_]/g, "\\$&");
  const search = escapedQuery ? `%${escapedQuery}%` : undefined;
  const where = and(
    status ? eq(order.status, status as OrderStatus) : undefined,
    search
      ? or(
          like(order.orderNumber, search),
          like(order.trackingId, search),
          like(order.customerName, search),
          like(order.customerEmail, search),
          like(order.customerPhone, search),
        )
      : undefined,
  );
  const { db } = getDrizzleClient();
  const [pageOrders, [{ value: total }]] = await Promise.all([
    db.select().from(order).where(where).orderBy(desc(order.createdAt)).limit(limit).offset((page - 1) * limit),
    db.select({ value: count() }).from(order).where(where),
  ]);
  const items = pageOrders.length
    ? await db.select().from(orderItem).where(inArray(orderItem.orderId, pageOrders.map((item) => item.id)))
    : [];
  const itemsByOrder = new Map<string, typeof items>();
  for (const item of items) {
    const orderItems = itemsByOrder.get(item.orderId) ?? [];
    orderItems.push(item);
    itemsByOrder.set(item.orderId, orderItems);
  }
  const orders = pageOrders.map((item) => ({ ...item, items: itemsByOrder.get(item.id) ?? [] }));

  return NextResponse.json({ orders, total, page, totalPages: Math.ceil(total / limit) });
}
