"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Button } from "@/components/ui/button";

type CouponActionsProps = {
  id: string;
  code: string;
  isActive: boolean;
};

export function CouponActions({ id, code, isActive }: CouponActionsProps) {
  const router = useRouter();
  const [active, setActive] = useState(isActive);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [error, setError] = useState("");

  async function updateStatus() {
    setIsUpdating(true);
    setError("");
    try {
      const response = await fetch(`/api/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !active }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Unable to update coupon status.");
        return;
      }
      setActive(!active);
      router.refresh();
    } catch {
      setError("Unable to update coupon status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function deleteCoupon() {
    setIsUpdating(true);
    setError("");
    try {
      const response = await fetch(`/api/coupons/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Unable to delete coupon.");
        return;
      }
      setIsDeleteOpen(false);
      router.refresh();
    } catch {
      setError("Unable to delete coupon. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="flex min-w-max items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={updateStatus}
        disabled={isUpdating}
        className="h-9 px-3 text-xs"
      >
        {isUpdating ? "Saving…" : active ? "Deactivate" : "Reactivate"}
      </Button>
      <AlertDialog.Root open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialog.Trigger asChild>
          <button
            type="button"
            disabled={isUpdating}
            className="inline-flex h-9 items-center justify-center rounded-[var(--radius-sm)] border border-red-200 px-3 text-xs font-medium text-[var(--error)] transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            Delete
          </button>
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[1px]" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[101] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-6 shadow-2xl focus:outline-none">
            <AlertDialog.Title className="font-display text-xl font-semibold text-[var(--charcoal)]">
              Delete coupon?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm leading-6 text-[var(--muted)]">
              This permanently removes <span className="font-mono font-semibold text-[var(--charcoal)]">{code}</span> from available coupons. Existing order records will remain unchanged.
            </AlertDialog.Description>
            {error && <p className="mt-3 text-sm text-[var(--error)]" role="alert">{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="outline" disabled={isUpdating}>Cancel</Button>
              </AlertDialog.Cancel>
              <Button
                type="button"
                variant="destructive"
                onClick={deleteCoupon}
                disabled={isUpdating}
              >
                {isUpdating ? "Deleting…" : "Delete coupon"}
              </Button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
      {error && !isDeleteOpen && <p className="max-w-40 text-xs text-[var(--error)]" role="alert">{error}</p>}
    </div>
  );
}
