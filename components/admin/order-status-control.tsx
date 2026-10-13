"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/lib/orders/status-transitions";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
} from "@/lib/orders/status-transitions";

type Props = {
  orderId: string;
  currentStatus: OrderStatus;
  courierName?: string | null;
  courierTracking?: string | null;
  paymentMethod?: string;
  paymentStatus?: string;
};

export function OrderStatusControl({
  orderId,
  currentStatus,
  courierName: initialCourier,
  courierTracking: initialTracking,
  paymentMethod,
  paymentStatus,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [courierName, setCourierName] = useState(initialCourier || "");
  const [courierTracking, setCourierTracking] = useState(initialTracking || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [deliveryEmailFailed, setDeliveryEmailFailed] = useState(false);
  const canConfirmPrepaid = paymentMethod !== "COD" && paymentStatus !== "PAID";
  const options = ORDER_STATUS_TRANSITIONS[currentStatus].filter(
    (nextStatus) => !(canConfirmPrepaid && nextStatus !== "CANCELLED"),
  );

  useEffect(() => {
    setStatus(currentStatus);
    setCourierName(initialCourier || "");
    setCourierTracking(initialTracking || "");
  }, [currentStatus, initialCourier, initialTracking]);

  async function handleSave() {
    if (
      status === currentStatus &&
      courierName === (initialCourier || "") &&
      courierTracking === (initialTracking || "")
    ) return;
    setLoading(true);
    setError(null);
    setSaveMessage("");
    setDeliveryEmailFailed(false);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: status === currentStatus ? currentStatus : status,
          courierName,
          courierTracking,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Update failed");
        return;
      }
      if (status === "OUT_FOR_DELIVERY" && data.deliveryEmailSent === false) {
        setSaveMessage("Status updated, but the customer email was not sent. Check Admin → Email log.");
        setDeliveryEmailFailed(true);
      } else if (status === "OUT_FOR_DELIVERY" && data.deliveryEmailSent === true) {
        setSaveMessage("Status updated and delivery email sent to the customer.");
      } else {
        setSaveMessage("Order update saved.");
      }
      router.refresh();
    } catch {
      setError("Could not save the order update. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 p-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-white">
      <h3 className="font-semibold text-sm">Update status</h3>
      <p className="text-xs text-[var(--muted)]">
        Current: <span className="font-medium text-[var(--charcoal)]">{ORDER_STATUS_LABELS[currentStatus]}</span>
      </p>
      {options.length > 0 && (
        <>
          <label htmlFor="order-next-status" className="sr-only">Next order status</label>
          <select
            id="order-next-status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as OrderStatus);
              setSaveMessage("");
              setDeliveryEmailFailed(false);
            }}
            className="w-full h-10 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-sm"
          >
            <option value={currentStatus}>{ORDER_STATUS_LABELS[currentStatus]} (current)</option>
            {options.map((nextStatus) => (
              <option key={nextStatus} value={nextStatus}>{ORDER_STATUS_LABELS[nextStatus]}</option>
            ))}
          </select>
          <p className="text-xs leading-5 text-[var(--muted)]">
            {canConfirmPrepaid
              ? "Verify the bank transfer in the Payment section before confirming this order."
              : "Update one step at a time. After saving this stage, the next fulfillment status will become available."}
          </p>
        </>
      )}
      <div>
        <label htmlFor="order-courier" className="text-xs text-[var(--muted)]">Courier</label>
        <input
          id="order-courier"
          value={courierName}
          onChange={(e) => {
            setCourierName(e.target.value);
            setSaveMessage("");
          }}
          className="w-full h-9 mt-1 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-sm"
          placeholder="Courier name"
        />
      </div>
      <div>
        <label htmlFor="order-courier-tracking" className="text-xs text-[var(--muted)]">Courier tracking #</label>
        <input
          id="order-courier-tracking"
          value={courierTracking}
          onChange={(e) => {
            setCourierTracking(e.target.value);
            setSaveMessage("");
          }}
          className="w-full h-9 mt-1 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-sm"
          placeholder="Tracking number"
        />
      </div>
      {error && <p className="text-sm text-[var(--error)]">{error}</p>}
      {saveMessage && (
        <p
          className={`text-sm ${deliveryEmailFailed ? "text-[var(--error)]" : "text-green-700"}`}
          role="status"
        >
          {saveMessage}
        </p>
      )}
      <Button
        size="sm"
        onClick={handleSave}
        disabled={
          loading ||
          (status === currentStatus &&
            courierName === (initialCourier || "") &&
            courierTracking === (initialTracking || ""))
        }
      >
        {loading ? "Saving…" : "Save status"}
      </Button>
    </div>
  );
}
