import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = { params: Promise<{ orderId: string }> };

export default async function OrderSuccessPage({ params }: Props) {
  const { orderId } = await params;

  let order = null;
  try {
    order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }, { trackingId: orderId }],
      },
      include: { items: true },
    });
  } catch {
    // DB may not be configured yet — show generic success with id
  }

  if (!order) {
    // Graceful fallback when DB offline or order not found
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="text-5xl mb-4">💗</div>
        <h1 className="font-display text-3xl font-semibold mb-2">
          Order Placed Successfully
        </h1>
        <p className="text-[var(--muted)] mb-2">Thank you for shopping with Mini Street</p>
        <p className="text-sm text-[var(--charcoal)] mb-8">
          Order reference: <strong>{orderId}</strong>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href={`/track-order/${orderId}`}>Track My Order</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="text-5xl mb-4" aria-hidden>💗</div>
      <h1 className="font-display text-3xl font-semibold mb-2">
        Order Placed Successfully
      </h1>
      <p className="text-[var(--muted)] mb-6">Thank you for shopping with us</p>

      <div className="text-left rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-6 mb-8 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">Order ID</span>
          <span className="font-medium">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">Tracking ID</span>
          <span className="font-medium">{order.trackingId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">Total</span>
          <span className="font-semibold">{formatPrice(Number(order.total))}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">Email</span>
          <span>{order.customerEmail}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild>
          <Link href={`/track-order/${order.trackingId}`}>Track My Order</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
