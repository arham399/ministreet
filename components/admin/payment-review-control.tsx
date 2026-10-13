"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = { orderId: string; paymentStatus: string };

export function PaymentReviewControl({ orderId, paymentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"verify" | "reject" | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [emailNotice, setEmailNotice] = useState("");
  const [confirmAction, setConfirmAction] = useState<"verify" | "reject" | null>(null);

  async function review() {
    if (!confirmAction) return;
    const action = confirmAction;
    setLoading(action);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/orders/${orderId}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Payment review failed.");
        return;
      }
      setMessage(action === "verify" ? "Payment verified and order automatically confirmed." : "Payment proof rejected. The order was cancelled and its inventory was restored.");
      if (data.emailSent === false) setEmailNotice("The order was updated, but the customer email could not be sent. Check Admin → Email log.");
      else setEmailNotice("A payment update email was sent to the customer.");
      setConfirmAction(null);
      router.refresh();
    } catch {
      setError("Could not save the payment review. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  if (paymentStatus !== "PENDING") {
    return <p className="mt-3 text-sm text-[var(--muted)]">This payment has already been reviewed.</p>;
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => { setError(""); setConfirmAction("verify"); }} disabled={loading !== null}>
          Verify payment
        </Button>
        <Button size="sm" variant="outline" onClick={() => { setError(""); setConfirmAction("reject"); }} disabled={loading !== null}>
          Reject proof
        </Button>
        {error && <p className="basis-full text-sm text-[var(--error)]" role="alert">{error}</p>}
        {message && <p className="basis-full text-sm text-green-700" role="status">{message}</p>}
      {emailNotice && <p className="basis-full text-sm text-[var(--muted)]" role="status">{emailNotice}</p>}
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="payment-confirm-title"
            aria-describedby="payment-confirm-description"
            className="admin-dialog rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xl sm:p-6"
          >
            <p className="section-label">Mini Street · Payment review</p>
            <h2 id="payment-confirm-title" className="mt-2 font-display text-2xl font-semibold">
              {confirmAction === "verify" ? "Verify this payment?" : "Reject this payment proof?"}
            </h2>
            <p id="payment-confirm-description" className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {confirmAction === "verify"
                ? "Please confirm you checked your bank account and the received transfer matches this order total. The order will then be eligible for fulfillment."
                : "This marks the submitted proof as not accepted, cancels the order, and restores its inventory. The customer will receive an email explaining the decision and how to contact support."}
            </p>
            <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setConfirmAction(null)} disabled={loading !== null}>
                Go back
              </Button>
              <Button type="button" onClick={review} disabled={loading !== null}>
                {loading ? "Saving review…" : confirmAction === "verify" ? "Yes, verify payment" : "Yes, reject proof"}
              </Button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
