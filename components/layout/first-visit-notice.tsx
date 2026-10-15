"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CreditCard, X } from "lucide-react";

const STORAGE_KEY = "mini-street:payment-notice-dismissed";

export function FirstVisitNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(window.localStorage.getItem(STORAGE_KEY) !== "true");
    } catch {
      setOpen(true);
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Keep the notice dismissible when browser storage is unavailable.
    }
    setOpen(false);
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) dismiss();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-[#21151d]/45 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          aria-describedby="first-visit-notice-description"
          className="fixed left-1/2 top-1/2 z-[100] w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-2xl)] border border-[var(--border)] bg-white p-6 shadow-soft-lg focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 sm:p-9"
        >
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close payment notice"
              className="absolute right-4 top-4 rounded-full p-2 text-[var(--muted)] transition-colors hover:bg-[var(--brand-blush)] hover:text-[var(--charcoal)]"
            >
              <X size={19} />
            </button>
          </Dialog.Close>

          <div className="mx-auto mb-5 grid size-12 place-items-center rounded-full bg-[var(--brand-blush)] text-[var(--brand-pink)]">
            <CreditCard size={22} aria-hidden="true" />
          </div>
          <p className="section-label mb-2 text-center">A little note before you shop</p>
          <Dialog.Title className="font-display text-center text-2xl font-semibold text-[var(--charcoal)] sm:text-3xl">
            Payment information
          </Dialog.Title>
          <Dialog.Description
            id="first-visit-notice-description"
            className="mx-auto mt-3 max-w-md text-center text-sm leading-6 text-[var(--muted)]"
          >
            We accept prepaid orders only. Cash on delivery is not available, so please complete payment online when placing your order.
          </Dialog.Description>

          <Dialog.Close asChild>
            <button
              type="button"
              className="mt-6 w-full rounded-[var(--radius-md)] bg-[var(--brand-pink)] px-5 py-3 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-[var(--brand-pink-deep)]"
            >
              Continue shopping
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
