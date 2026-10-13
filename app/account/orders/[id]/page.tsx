import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { and, eq, or } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { order, orderItem } from "@/lib/db/drizzle/schema";
import { formatPrice } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function AccountOrderDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  let foundOrder: (typeof order.$inferSelect & { items: (typeof orderItem.$inferSelect)[] }) | null = null;
  try {
    const { db } = getDrizzleClient();
    const [result] = await db
      .select()
      .from(order)
      .where(
        and(
          eq(order.id, id),
          or(eq(order.userId, session.user.id), eq(order.customerEmail, session.user.email!)),
        ),
      )
      .limit(1);
    if (result) {
      const items = await db.select().from(orderItem).where(eq(orderItem.orderId, result.id));
      foundOrder = { ...result, items };
    }
  } catch {
    foundOrder = null;
  }

  if (!foundOrder) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/account/orders" className="text-sm text-[var(--brand-pink)] hover:underline">← Orders</Link>
      <h1 className="font-display text-2xl font-semibold mt-4 mb-2">{foundOrder.orderNumber}</h1>
      <p className="text-sm text-[var(--muted)] mb-6">Status: {foundOrder.status}</p>
      <ul className="space-y-2 mb-6">
        {foundOrder.items.map((item) => (
          <li key={item.id} className="flex justify-between text-sm">
            <span>{item.productNameSnapshot} × {item.quantity}</span>
            <span>{formatPrice(Number(item.finalPrice))}</span>
          </li>
        ))}
      </ul>
      <p className="font-semibold">Total: {formatPrice(Number(foundOrder.total))}</p>
      <Link href={`/track-order/${foundOrder.trackingId}`} className="inline-block mt-4 text-sm text-[var(--brand-pink)] hover:underline">
        Track this order
      </Link>
    </div>
  );
}
