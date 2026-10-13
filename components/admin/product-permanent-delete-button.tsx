"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ProductPermanentDeleteButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function removePermanently() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/products/${id}/permanent`, { method: "DELETE" });
      const result = await response.json() as { error?: string; warning?: string };
      if (!response.ok) {
        setError(result.error || "The product could not be deleted. Please try again.");
        return;
      }
      setSuccessMessage(result.warning || "The product was permanently deleted. Order records remain available with their saved product details.");
    } catch {
      setError("The product could not be deleted. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setOpen(false);
    if (successMessage) router.refresh();
  }

  return <>
    <Button type="button" size="sm" variant="outline" className="ml-0 border-red-200 text-red-700 hover:bg-red-50" onClick={() => { setError(""); setSuccessMessage(""); setOpen(true); }}>
      Delete permanently
    </Button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <section role="alertdialog" aria-modal="true" aria-labelledby={`delete-product-${id}`} className="admin-dialog rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xl sm:p-6">
        {successMessage ? <>
          <p className="section-label">Mini Street · Product management</p>
          <h2 id={`delete-product-${id}`} className="mt-2 font-display text-2xl font-semibold">Product deleted</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{successMessage}</p>
          <div className="mt-6 flex justify-end">
            <Button type="button" onClick={close}>Done</Button>
          </div>
        </> : <>
          <p className="section-label">Mini Street · Product management</p>
          <h2 id={`delete-product-${id}`} className="mt-2 font-display text-2xl font-semibold">Permanently delete {name}?</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            This permanently removes the product and its uploaded product images. Orders containing it must first be completed, delivered, cancelled, returned, or refunded. Saved order line details are retained.
          </p>
          {error && <p className="mt-3 text-sm text-[var(--error)]" role="alert">{error}</p>}
          <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={close} disabled={loading}>Keep product</Button>
            <Button type="button" className="bg-red-600 hover:bg-red-700" onClick={removePermanently} disabled={loading}>
              {loading ? "Deleting…" : "Yes, delete permanently"}
            </Button>
          </div>
        </>}
      </section>
    </div>}
  </>;
}
