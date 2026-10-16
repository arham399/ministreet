"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Button } from "@/components/ui/button";

export function DiscountDeleteButton({ id, name, usageCount }: { id: string; name: string; usageCount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function deleteDiscount() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/discounts/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Unable to delete discount.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Unable to delete discount. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AlertDialog.Root open={open} onOpenChange={setOpen}>
        <AlertDialog.Trigger asChild>
          <button type="button" className="inline-flex h-9 items-center justify-center rounded-[var(--radius-sm)] border border-red-200 px-3 text-xs font-medium text-[var(--error)] transition-colors hover:bg-red-50">Delete</button>
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[1px]" />
          <AlertDialog.Content className="admin-dialog fixed left-1/2 top-1/2 z-[101] w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-5 shadow-2xl focus:outline-none sm:p-6">
            <AlertDialog.Title className="font-display text-xl font-semibold text-[var(--charcoal)]">Delete this discount?</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm leading-6 text-[var(--muted)]">
              This permanently removes <span className="font-semibold text-[var(--charcoal)]">{name}</span> from future orders. Existing order records remain unchanged.
            </AlertDialog.Description>
            {usageCount > 0 && (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-900" role="note">
                This discount has been used {usageCount} {usageCount === 1 ? "time" : "times"}. Review its usage before deleting; past order records will remain unchanged.
              </p>
            )}
            {error && <p className="mt-3 text-sm text-[var(--error)]" role="alert">{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <AlertDialog.Cancel asChild><Button type="button" variant="outline" disabled={busy}>Cancel</Button></AlertDialog.Cancel>
              <Button type="button" variant="destructive" onClick={deleteDiscount} disabled={busy}>{busy ? "Deleting…" : "Delete discount"}</Button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
