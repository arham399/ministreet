import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { formatPrice } from "@/lib/utils";
import { OrderStatusControl } from "@/components/admin/order-status-control";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  let order = null;
  try {
    order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        trackingEvents: { orderBy: { eventAt: "asc" } },
        statusHistory: { orderBy: { createdAt: "desc" } },
        invoice: true,
      },
    });
  } catch { /* */ }

  if (!order) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <Link href="/admin/orders" className="text-xs text-[var(--brand-pink)] hover:underline">← Orders</Link>
          <h1 className="text-xl font-semibold mt-1">{order.orderNumber}</h1>
          <p className="text-sm text-[var(--muted)]">Tracking: {order.trackingId}</p>
        </div>
        {order.invoice && (
          <Link
            href={`/api/invoices/${order.id}`}
            className="text-sm px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] hover:bg-[var(--brand-blush)]"
          >
            Invoice
          </Link>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-5">
            <h2 className="font-semibold text-sm mb-3">Customer</h2>
            <p className="text-sm">{order.customerName}</p>
            <p className="text-sm text-[var(--muted)]">{order.customerEmail}</p>
            <p className="text-sm text-[var(--muted)]">{order.customerPhone}</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-5">
            <h2 className="font-semibold text-sm mb-3">Shipping</h2>
            <p className="text-sm">{order.shippingLine1}</p>
            {order.shippingLine2 && <p className="text-sm">{order.shippingLine2}</p>}
            <p className="text-sm text-[var(--muted)]">
              {order.shippingCity}, {order.shippingProvince}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-5">
            <h2 className="font-semibold text-sm mb-3">Products</h2>
            <ul className="space-y-2 text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.productNameSnapshot} × {item.quantity}</span>
                  <span>{formatPrice(Number(item.finalPrice))}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-[var(--border)] mt-3 pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-[var(--muted)]">Subtotal</span><span>{formatPrice(Number(order.subtotal))}</span></div>
              <div className="flex justify-between"><span className="text-[var(--muted)]">Discount</span><span>-{formatPrice(Number(order.discountAmount))}</span></div>
              <div className="flex justify-between"><span className="text-[var(--muted)]">Shipping</span><span>{formatPrice(Number(order.shippingAmount))}</span></div>
              <div className="flex justify-between font-semibold"><span>Total</span><span>{formatPrice(Number(order.total))}</span></div>
            </div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-5">
            <h2 className="font-semibold text-sm mb-3">Timeline</h2>
            <ul className="space-y-3">
              {order.trackingEvents.map((e) => (
                <li key={e.id} className="text-sm">
                  <p className="font-medium">{e.title}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {new Date(e.eventAt).toLocaleString()}
                  </p>
                  {e.description && <p className="text-[var(--muted)]">{e.description}</p>}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <OrderStatusControl
            orderId={order.id}
            currentStatus={order.status}
            courierName={order.courierName}
            courierTracking={order.courierTracking}
          />
        </div>
      </div>
    </div>
  );
}
