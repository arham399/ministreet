"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CategoryDeleteButton({ id, name, productCount }: { id: string; name: string; productCount: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Could not delete the category."); return; }
      setConfirming(false);
      router.refresh();
    } catch { setError("Could not delete the category. Please try again."); }
    finally { setLoading(false); }
  }

  return <>
    <Button type="button" size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => setConfirming(true)}>Delete</Button>
    {confirming && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <section role="alertdialog" aria-modal="true" aria-labelledby={`delete-category-${id}`} className="admin-dialog rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xl sm:p-6">
        <p className="section-label">Mini Street · Catalog</p>
        <h2 id={`delete-category-${id}`} className="mt-2 font-display text-2xl font-semibold">Delete {name}?</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">This permanently removes the category. {productCount ? `${productCount} product${productCount === 1 ? "" : "s"} will remain in your catalog with no category assigned.` : "No products are currently assigned to this category."} This cannot be undone.</p>
        {error && <p className="mt-3 text-sm text-[var(--error)]" role="alert">{error}</p>}
        <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => setConfirming(false)} disabled={loading}>Keep category</Button>
          <Button type="button" className="bg-red-600 hover:bg-red-700" onClick={remove} disabled={loading}>{loading ? "Deleting…" : "Yes, delete category"}</Button>
        </div>
      </section>
    </div>}
  </>;
}
