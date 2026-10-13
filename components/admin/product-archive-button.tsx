"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ProductArchiveButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function archive() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Could not archive this product."); return; }
      setConfirming(false);
      router.refresh();
    } catch { setError("Could not archive this product. Please try again."); }
    finally { setLoading(false); }
  }

  return <>
    <Button type="button" size="sm" variant="outline" className="ml-0 border-red-200 text-red-700 hover:bg-red-50" onClick={() => setConfirming(true)}>Archive</Button>
    {confirming && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <section role="alertdialog" aria-modal="true" aria-labelledby={`archive-product-${id}`} className="admin-dialog rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xl sm:p-6">
        <p className="section-label">Mini Street · Product management</p>
        <h2 id={`archive-product-${id}`} className="mt-2 font-display text-2xl font-semibold">Archive {name}?</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">This hides the product from the storefront while preserving its order history and image files. You can restore it later by editing the product and marking it active.</p>
        {error && <p className="mt-3 text-sm text-[var(--error)]" role="alert">{error}</p>}
        <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => setConfirming(false)} disabled={loading}>Keep product</Button>
          <Button type="button" className="bg-red-600 hover:bg-red-700" onClick={archive} disabled={loading}>{loading ? "Archiving…" : "Yes, archive product"}</Button>
        </div>
      </section>
    </div>}
  </>;
}
