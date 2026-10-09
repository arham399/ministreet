import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "My Account" };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let orders: { id: string; orderNumber: string; total: unknown; status: string; createdAt: Date }[] = [];
  try {
    orders = await prisma.order.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { customerEmail: session.user.email },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  } catch { /* DB offline */ }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-semibold mb-2">Hi, {session.user.name || "there"}</h1>
      <p className="text-sm text-[var(--muted)] mb-8">{session.user.email}</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <Link href="/account/orders" className="p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white hover:border-[var(--brand-pink-soft)] shadow-soft">
          <p className="font-medium text-sm">Orders</p>
          <p className="text-xs text-[var(--muted)] mt-1">View order history</p>
        </Link>
        <Link href="/account/profile" className="p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white hover:border-[var(--brand-pink-soft)] shadow-soft">
          <p className="font-medium text-sm">Profile</p>
          <p className="text-xs text-[var(--muted)] mt-1">Name & contact</p>
        </Link>
        <Link href="/account/wishlist" className="p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white hover:border-[var(--brand-pink-soft)] shadow-soft">
          <p className="font-medium text-sm">Wishlist</p>
          <p className="text-xs text-[var(--muted)] mt-1">Saved pieces</p>
        </Link>
      </div>

      <h2 className="font-semibold mb-4">Recent orders</h2>
      {orders.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No orders yet. <Link href="/shop" className="text-[var(--brand-pink)] hover:underline">Start shopping</Link></p>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/account/orders/${o.id}`}
                className="flex justify-between items-center p-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-white hover:border-[var(--brand-pink-soft)]"
              >
                <div>
                  <p className="font-medium text-sm">{o.orderNumber}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {new Date(o.createdAt).toLocaleDateString()} · {o.status}
                  </p>
                </div>
                <span className="text-sm font-semibold">{formatPrice(Number(o.total))}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
