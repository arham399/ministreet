import Link from "next/link";
import {
  BadgeCheck,
  CircleCheck,
  Heart,
  MapPin,
  Package,
  PackageCheck,
  Sparkles,
  Truck,
  Undo2,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import { asc, eq, or } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { order as orderTable, orderItem, trackingEvent } from "@/lib/db/drizzle/schema";
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

const STATUS_ICONS: Record<string, LucideIcon> = {
  PLACED: Package,
  CONFIRMED: BadgeCheck,
  PROCESSING: Sparkles,
  PACKED: PackageCheck,
  SHIPPED: Truck,
  OUT_FOR_DELIVERY: MapPin,
  DELIVERED: Heart,
  CANCELLED: X,
  RETURNED: Undo2,
  REFUNDED: WalletCards,
};

type TrackingOrder = typeof orderTable.$inferSelect & {
  items: (typeof orderItem.$inferSelect)[];
  trackingEvents: (typeof trackingEvent.$inferSelect)[];
};

type TrackingStep = {
  status: string;
  title: string;
  description: string | null | undefined;
  eventAt: Date | undefined;
};

export default async function TrackingDetailPage({ params }: Props) {
  const { trackingId } = await params;
  const decoded = decodeURIComponent(trackingId);

  let foundOrder: TrackingOrder | null = null;
  try {
    const { db } = getDrizzleClient();
    const [result] = await db
      .select()
      .from(orderTable)
      .where(
        or(
          eq(orderTable.trackingId, decoded),
          eq(orderTable.orderNumber, decoded),
          eq(orderTable.id, decoded),
        ),
      )
      .limit(1);
    if (result) {
      const [items, trackingEvents] = await Promise.all([
        db.select().from(orderItem).where(eq(orderItem.orderId, result.id)),
        db.select().from(trackingEvent).where(eq(trackingEvent.orderId, result.id)).orderBy(asc(trackingEvent.eventAt)),
      ]);
      foundOrder = { ...result, items, trackingEvents };
    }
  } catch {
    // DB unavailable
  }

  if (!foundOrder) {
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

  const order = foundOrder;
  const currentStatus = order.status;
  const currentIdx = STATUS_ORDER.indexOf(
    currentStatus as (typeof STATUS_ORDER)[number]
  );
  const isTerminal = ["CANCELLED", "RETURNED", "REFUNDED"].includes(currentStatus);
  const paymentLabel = order.paymentStatus === "PAID"
    ? { title: "Payment verified", description: "Your bank transfer has been verified. Your order can now be prepared.", icon: BadgeCheck }
    : order.paymentStatus === "FAILED"
      ? { title: "Payment not verified · Order cancelled", description: "We could not verify the submitted proof and cancelled this order. Contact support if you believe this is an error.", icon: X }
      : { title: "Payment verification in progress", description: "We received your payment screenshot. We’ll update you after reviewing the transfer.", icon: WalletCards };
  const timelineSteps: TrackingStep[] = isTerminal
    ? order.trackingEvents.map((event) => ({
        status: event.status,
        title: event.title,
        description: event.description,
        eventAt: event.eventAt,
      }))
    : STATUS_ORDER.map((status) => {
        const event = order.trackingEvents.find((item) => item.status === status);
        const copy = TRACKING_STATUS_COPY[status];
        return {
          status,
          title: event?.title || copy?.title || status,
          description: event?.description || copy?.description,
          eventAt: event?.eventAt,
        };
      });

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 sm:py-16">
      <h1 className="font-display text-3xl font-semibold mb-1">Your Mini Street order</h1>
      <p className="text-sm text-[var(--muted)] mb-8">
        Tracking ID: <span className="font-medium text-[var(--charcoal)]">{order.trackingId}</span>
      </p>

      {order.paymentMethod === "BANK_TRANSFER" && (
        <div className="mb-8 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-blush)] text-[var(--brand-pink)]">
              <paymentLabel.icon size={19} aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold">{paymentLabel.title}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{paymentLabel.description}</p>
              <p className="mt-2 text-sm"><span className="text-[var(--muted)]">Payment status: </span><span className="font-medium">{order.paymentStatus === "PAID" ? "Verified" : order.paymentStatus === "FAILED" ? "Not verified" : "Under review"}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative mb-12">
        {timelineSteps.map((step, idx) => {
          const status = step.status;
          const StatusIcon = STATUS_ICONS[status] || CircleCheck;
          const isConnectorComplete = isTerminal || (currentIdx >= 0 && idx < currentIdx);
          const done =
            isTerminal ||
            (currentIdx >= 0 && STATUS_ORDER.indexOf(status as typeof STATUS_ORDER[number]) <= currentIdx);
          const active = !isTerminal && status === currentStatus;

          return (
            <div key={status + idx} className="flex gap-4">
              <div className="relative flex w-10 shrink-0 justify-center">
                <div
                  className={cn(
                    "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors",
                    done
                      ? "border-[var(--brand-pink)] bg-[var(--brand-pink)] text-white"
                      : "border-[var(--border)] bg-white text-[var(--muted)]",
                    active && "tracking-active"
                  )}
                  aria-label={`${step.title}${active ? ", current status" : done ? ", completed" : ", upcoming"}`}
                >
                  <StatusIcon size={18} strokeWidth={2} aria-hidden="true" />
                </div>
                {idx < timelineSteps.length - 1 && (
                  <div
                    className={cn(
                      "absolute left-1/2 top-10 bottom-0 w-0.5 -translate-x-1/2",
                      isConnectorComplete ? "bg-[var(--brand-pink)]" : "bg-[var(--border)]"
                    )}
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1 pb-8 pt-1.5 last:pb-0">
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
