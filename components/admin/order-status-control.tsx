"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const NEXT: Record<string, string[]> = {
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["RETURNED"],
  RETURNED: ["REFUNDED"],
};

type Props = {
  orderId: string;
  currentStatus: string;
  courierName?: string | null;
  courierTracking?: string | null;
};

export function OrderStatusControl({
  orderId,
  currentStatus,
  courierName: initialCourier,
  courierTracking: initialTracking,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [courierName, setCourierName] = useState(initialCourier || "");
  const [courierTracking, setCourierTracking] = useState(initialTracking || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = NEXT[currentStatus] || [];

  async function handleSave() {
    if (status === currentStatus && !courierName && !courierTracking) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: status === currentStatus ? currentStatus : status,
        courierName: courierName || undefined,
        courierTracking: courierTracking || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Update failed");
      setLoading(false);
      return;
    }
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="space-y-4 p-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-white">
      <h3 className="font-semibold text-sm">Update status</h3>
      <p className="text-xs text-[var(--muted)]">Current: {currentStatus}</p>
      {options.length > 0 && (
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full h-10 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-sm"
        >
          <option value={currentStatus}>{currentStatus} (current)</option>
          {options.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}
      <div>
        <label className="text-xs text-[var(--muted)]">Courier</label>
        <input
          value={courierName}
          onChange={(e) => setCourierName(e.target.value)}
          className="w-full h-9 mt-1 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-sm"
          placeholder="Courier name"
        />
      </div>
      <div>
        <label className="text-xs text-[var(--muted)]">Courier tracking #</label>
        <input
          value={courierTracking}
          onChange={(e) => setCourierTracking(e.target.value)}
          className="w-full h-9 mt-1 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-sm"
          placeholder="Tracking number"
        />
      </div>
      {error && <p className="text-sm text-[var(--error)]">{error}</p>}
      <Button size="sm" onClick={handleSave} disabled={loading || options.length === 0}>
        {loading ? "Saving…" : "Save status"}
      </Button>
    </div>
  );
}
