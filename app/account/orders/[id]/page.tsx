import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { formatPrice } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function AccountOrderDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: {
      id,
      OR: [{ userId: session.user.id }, { customerEmail: session.user.email }],
    },
    include: { items: true },
  }).catch(() => null);

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/account/orders" className="text-sm text-[var(--brand-pink)] hover:underline">← Orders</Link>
      <h1 className="font-display text-2xl font-semibold mt-4 mb-2">{order.orderNumber}</h1>
      <p className="text-sm text-[var(--muted)] mb-6">Status: {order.status}</p>
      <ul className="space-y-2 mb-6">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between text-sm">
            <span>{item.productNameSnapshot} × {item.quantity}</span>
            <span>{formatPrice(Number(item.finalPrice))}</span>
          </li>
        ))}
      </ul>
      <p className="font-semibold">Total: {formatPrice(Number(order.total))}</p>
      <Link href={`/track-order/${order.trackingId}`} className="inline-block mt-4 text-sm text-[var(--brand-pink)] hover:underline">
        Track this order
      </Link>
    </div>
  );
}
