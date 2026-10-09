import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { formatPrice } from "@/lib/utils";
import { TRACKING_STATUS_COPY } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ trackingId: string }> };

const STATUS_ORDER = [
  "PLACED",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

export default async function TrackingDetailPage({ params }: Props) {
  const { trackingId } = await params;
  const decoded = decodeURIComponent(trackingId);

  let order = null;
  try {
    order = await prisma.order.findFirst({
      where: {
        OR: [{ trackingId: decoded }, { orderNumber: decoded }, { id: decoded }],
      },
      include: {
        items: true,
        trackingEvents: { orderBy: { eventAt: "asc" } },
      },
    });
  } catch {
    // DB unavailable
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold mb-3">Order not found</h1>
        <p className="text-[var(--muted)] mb-6">
          We couldn&apos;t find an order with ID &ldquo;{decoded}&rdquo;. Please check and try again.
        </p>
        <Link href="/track-order" className="text-[var(--brand-pink)] hover:underline text-sm">
          Try another ID
        </Link>
      </div>
    );
  }

  const currentStatus = order.status;
  const currentIdx = STATUS_ORDER.indexOf(
    currentStatus as (typeof STATUS_ORDER)[number]
  );
  const isTerminal = ["CANCELLED", "RETURNED", "REFUNDED"].includes(currentStatus);

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 sm:py-16">
      <h1 className="font-display text-3xl font-semibold mb-1">Your Mini Street order</h1>
      <p className="text-sm text-[var(--muted)] mb-8">
        Tracking ID: <span className="font-medium text-[var(--charcoal)]">{order.trackingId}</span>
      </p>

      {/* Timeline */}
      <div className="relative mb-12">
        {(isTerminal
          ? order.trackingEvents
          : STATUS_ORDER.map((status) => {
              const event = order.trackingEvents.find((e) => e.status === status);
              const copy = TRACKING_STATUS_COPY[status];
              return {
                status,
                title: event?.title || copy?.title || status,
                description: event?.description || copy?.description,
                eventAt: event?.eventAt,
              };
            })
        ).map((step, idx) => {
          const status = "status" in step ? step.status : step.status;
          const done =
            isTerminal ||
            (currentIdx >= 0 && STATUS_ORDER.indexOf(status as typeof STATUS_ORDER[number]) <= currentIdx);
          const active = !isTerminal && status === currentStatus;

          return (
            <div key={status + idx} className="flex gap-4 pb-8 last:pb-0">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0",
                    done
                      ? "bg-[var(--brand-pink)] border-[var(--brand-pink)] text-white"
                      : "bg-white border-[var(--border)] text-[var(--muted)]",
                    active && "tracking-active"
                  )}
                >
                  {done ? "✓" : idx + 1}
                </div>
                {idx < (isTerminal ? order.trackingEvents.length - 1 : STATUS_ORDER.length - 1) && (
                  <div
                    className={cn(
                      "w-0.5 flex-1 mt-1",
                      done ? "bg-[var(--brand-pink)]" : "bg-[var(--border)]"
                    )}
                  />
                )}
              </div>
              <div className="pt-1">
                <p className={cn("font-medium text-sm", active && "text-[var(--brand-pink)]")}>
                  {step.title}
                </p>
                {"eventAt" in step && step.eventAt && (
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    {new Date(step.eventAt).toLocaleString("en-PK", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                )}
                {step.description && (
                  <p className="text-sm text-[var(--muted)] mt-1">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Products */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-5 mb-6">
        <h2 className="font-semibold text-sm mb-3">Products</h2>
        <ul className="space-y-2">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between text-sm">
              <span>
                {item.productNameSnapshot} × {item.quantity}
              </span>
              <span>{formatPrice(Number(item.finalPrice))}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-[var(--border)] mt-3 pt-3 flex justify-between font-semibold text-sm">
          <span>Total</span>
          <span>{formatPrice(Number(order.total))}</span>
        </div>
      </div>

      {/* Delivery */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-5 text-sm">
        <h2 className="font-semibold mb-2">Delivery</h2>
        <p>{order.customerName}</p>
        <p className="text-[var(--muted)]">
          {order.shippingLine1}
          {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}
        </p>
        <p className="text-[var(--muted)]">
          {order.shippingCity}, {order.shippingProvince}
        </p>
      </div>
    </div>
  );
}
