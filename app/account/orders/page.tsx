import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "My Orders" };

export default async function AccountOrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let orders: { id: string; orderNumber: string; trackingId: string; total: unknown; status: string; createdAt: Date }[] = [];
  try {
    orders = await prisma.order.findMany({
      where: {
        OR: [{ userId: session.user.id }, { customerEmail: session.user.email }],
      },
      orderBy: { createdAt: "desc" },
    });
  } catch { /* */ }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-semibold mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <p className="text-[var(--muted)]">No orders yet.</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="flex flex-wrap justify-between gap-2 p-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-white">
              <div>
                <Link href={`/account/orders/${o.id}`} className="font-medium text-sm hover:text-[var(--brand-pink)]">
                  {o.orderNumber}
                </Link>
                <p className="text-xs text-[var(--muted)]">{new Date(o.createdAt).toLocaleDateString()} · {o.status}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">{formatPrice(Number(o.total))}</p>
                <Link href={`/track-order/${o.trackingId}`} className="text-xs text-[var(--brand-pink)] hover:underline">
                  Track
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
