"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton({
  compact = false,
  iconOnly = false,
}: {
  compact?: boolean;
  iconOnly?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function confirmSignOut() {
    setPending(true);
    setError("");
    try {
      await signOut({ callbackUrl: "/admin/login" });
    } catch {
      setError("We couldn't sign you out. Please try again.");
      setPending(false);
    }
  }

  return (
    <AlertDialog.Root onOpenChange={(open) => { if (open) setError(""); }}>
      <AlertDialog.Trigger asChild>
        <button
          type="button"
          disabled={pending}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white disabled:opacity-60 ${compact ? "justify-center" : ""}`}
        >
          <LogOut size={17} aria-hidden="true" />
          <span className={iconOnly ? "sr-only" : undefined}>{pending ? "Signing out…" : "Sign out"}</span>
        </button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[100] bg-[#211820]/55 backdrop-blur-[2px]" />
        <AlertDialog.Content className="admin-dialog fixed left-1/2 top-1/2 z-[101] w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-[24px] border border-[#f0dce7] bg-[#fffafc] p-5 shadow-2xl focus:outline-none sm:p-6">
          <div className="mb-4 grid size-11 place-items-center rounded-full bg-[#fcecf3] text-[#c2186b]"><LogOut size={18} aria-hidden="true" /></div>
          <AlertDialog.Title className="font-display text-xl font-semibold text-[#342a32]">Sign out of Mini Street admin?</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm leading-6 text-[#82737d]">
            Are you sure you want to sign out? You can sign back in at any time.
          </AlertDialog.Description>
          {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <AlertDialog.Cancel asChild><Button type="button" variant="outline" disabled={pending}>Stay signed in</Button></AlertDialog.Cancel>
            <Button type="button" onClick={confirmSignOut} disabled={pending}>{pending ? "Signing out…" : "Sign out"}</Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
