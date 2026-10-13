import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { invoice, order as orderTable, orderItem, orderStatusHistory, trackingEvent } from "@/lib/db/drizzle/schema";
import { formatPrice } from "@/lib/utils";
import { OrderStatusControl } from "@/components/admin/order-status-control";
import { PaymentReviewControl } from "@/components/admin/payment-review-control";
import { createPaymentProofSignedUrl } from "@/lib/storage/payment-proofs";
import { OrderDeleteButton } from "@/components/admin/order-delete-button";
import { auth } from "@/lib/auth/config";
import { can } from "@/lib/auth/permissions";

export const runtime = "nodejs";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  let foundOrder:
    | ((typeof orderTable.$inferSelect) & {
        items: (typeof orderItem.$inferSelect)[];
        trackingEvents: (typeof trackingEvent.$inferSelect)[];
        statusHistory: (typeof orderStatusHistory.$inferSelect)[];
        invoice: typeof invoice.$inferSelect | null;
      })
    | null = null;
  try {
    const { db } = getDrizzleClient();
    const [result] = await db.select().from(orderTable).where(eq(orderTable.id, id)).limit(1);
    if (result) {
      const [items, trackingEvents, statusHistory, invoices] = await Promise.all([
        db.select().from(orderItem).where(eq(orderItem.orderId, id)),
        db.select().from(trackingEvent).where(eq(trackingEvent.orderId, id)).orderBy(asc(trackingEvent.eventAt)),
        db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, id)).orderBy(desc(orderStatusHistory.createdAt)),
        db.select().from(invoice).where(eq(invoice.orderId, id)).limit(1),
      ]);
      foundOrder = { ...result, items, trackingEvents, statusHistory, invoice: invoices[0] ?? null };
    }
  } catch { /* */ }

  if (!foundOrder) notFound();
  const order = foundOrder;
  const session = await auth();
  const mayDeleteOrder = can(session?.user?.role, "orders:write");
  let paymentProofUrl: string | null = null;
  if (order.paymentProofPath) {
    try { paymentProofUrl = await createPaymentProofSignedUrl(order.paymentProofPath); }
    catch { /* Keep the admin page available if Storage is temporarily unavailable. */ }
  }

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
            <h2 className="font-semibold text-sm mb-3">Payment</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-[var(--muted)]">Method</dt><dd>{order.paymentMethod.replaceAll("_", " ")}</dd>
              <dt className="text-[var(--muted)]">Status</dt><dd className="font-medium">{order.paymentStatus}</dd>
              <dt className="text-[var(--muted)]">Amount due</dt><dd>{formatPrice(Number(order.total))}</dd>
            </dl>
            {paymentProofUrl ? (
              <a href={paymentProofUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-medium text-[var(--brand-pink)] underline underline-offset-4">
                Open payment screenshot (private link)
              </a>
            ) : order.paymentProofPath ? (
              <p className="mt-3 text-sm text-[var(--error)]">Payment screenshot is temporarily unavailable. Check Supabase Storage settings.</p>
            ) : null}
            {order.paymentProofPath && <PaymentReviewControl orderId={order.id} paymentStatus={order.paymentStatus} />}
            {order.paymentMethod === "BANK_TRANSFER" && order.paymentStatus === "FAILED" && (
              <p className="mt-3 text-sm text-[var(--error)]">Rejected payment cannot be fulfilled. Contact the customer to resolve it, or cancel the order to return stock.</p>
            )}
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
          <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4">
          <OrderStatusControl
            orderId={order.id}
            currentStatus={order.status}
            courierName={order.courierName}
            courierTracking={order.courierTracking}
            paymentMethod={order.paymentMethod}
            paymentStatus={order.paymentStatus}
          />
          </div>
          {mayDeleteOrder && <div className="rounded-[var(--radius-md)] border border-red-100 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold">Delete order</h2>
            <p className="mb-3 text-xs text-[var(--muted)]">Only cancelled or delivered orders may be permanently removed.</p>
            <OrderDeleteButton orderId={order.id} orderNumber={order.orderNumber} status={order.status} />
          </div>}
        </div>
      </div>
    </div>
  );
}
