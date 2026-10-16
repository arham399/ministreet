"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Button } from "@/components/ui/button";

export function OfferActions({ id, title, isActive }: { id: string; title: string; isActive: boolean }) {
  const router = useRouter();
  const [active, setActive] = useState(isActive);
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState("");

  async function toggleActive() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/offers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !active }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Unable to update this offer.");
        return;
      }
      setActive(!active);
      router.refresh();
    } catch {
      setError("Unable to update this offer. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteOffer() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/offers/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Unable to delete this offer.");
        return;
      }
      setDeleteOpen(false);
      router.refresh();
    } catch {
      setError("Unable to delete this offer. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button type="button" size="sm" variant="outline" onClick={toggleActive} disabled={busy} className="h-9 px-3 text-xs">
        {busy ? "Saving…" : active ? "Deactivate" : "Activate"}
      </Button>
      <AlertDialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialog.Trigger asChild>
          <button type="button" disabled={busy} className="inline-flex h-9 items-center justify-center rounded-[var(--radius-sm)] border border-red-200 px-3 text-xs font-medium text-[var(--error)] transition-colors hover:bg-red-50 disabled:opacity-50">
            Delete
          </button>
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[1px]" />
          <AlertDialog.Content className="admin-dialog fixed left-1/2 top-1/2 z-[101] w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-5 shadow-2xl focus:outline-none sm:p-6">
            <AlertDialog.Title className="font-display text-xl font-semibold text-[var(--charcoal)]">Delete this offer?</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm leading-6 text-[var(--muted)]">
              This permanently removes <span className="font-semibold text-[var(--charcoal)]">{title}</span> from your store.
            </AlertDialog.Description>
            {error && <p className="mt-3 text-sm text-[var(--error)]" role="alert">{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <AlertDialog.Cancel asChild><Button type="button" variant="outline" disabled={busy}>Cancel</Button></AlertDialog.Cancel>
              <Button type="button" variant="destructive" onClick={deleteOffer} disabled={busy}>{busy ? "Deleting…" : "Delete offer"}</Button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
      {error && !deleteOpen && <p className="w-full text-right text-xs text-[var(--error)]" role="alert">{error}</p>}
    </div>
  );
}
