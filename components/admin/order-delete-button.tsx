"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function OrderDeleteButton({ orderId, orderNumber, status }: { orderId: string; orderNumber: string; status: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canDelete = status === "CANCELLED" || status === "DELIVERED";

  async function removeOrder() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Could not delete this order.");
        return;
      }
      setConfirming(false);
      if (result.storageCleanupPending) setNotice("Order deleted. Its payment screenshot could not be removed from Supabase Storage; review the payment-proofs bucket.");
      else router.push("/admin/orders?deleted=1");
    } catch {
      setError("Could not delete the order. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!canDelete) return <p className="text-xs text-[var(--muted)]">Deletion is available after cancellation or delivery.</p>;
  return (
    <>
      <Button type="button" size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => { setError(""); setConfirming(true); }}>Delete order</Button>
      {notice && <p className="mt-2 text-xs text-amber-700" role="status">{notice}</p>}
      {error && !confirming && <p className="mt-2 text-xs text-[var(--error)]" role="alert">{error}</p>}
      {confirming && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <section role="alertdialog" aria-modal="true" aria-labelledby="delete-order-title" aria-describedby="delete-order-description" className="admin-dialog rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xl sm:p-6">
          <p className="section-label">Mini Street · Order management</p>
          <h2 id="delete-order-title" className="mt-2 font-display text-2xl font-semibold">Delete order {orderNumber}?</h2>
          <p id="delete-order-description" className="mt-3 text-sm leading-6 text-[var(--muted)]">This permanently removes the order and its order items, invoice, status history, tracking events, and payment screenshot from Supabase Storage. This cannot be undone.</p>
          {error && <p className="mt-3 text-sm text-[var(--error)]" role="alert">{error}</p>}
          <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => setConfirming(false)} disabled={loading}>Keep order</Button>
            <Button type="button" className="bg-red-600 hover:bg-red-700" onClick={removeOrder} disabled={loading}>{loading ? "Deleting…" : "Yes, permanently delete"}</Button>
          </div>
        </section>
      </div>}
    </>
  );
}
