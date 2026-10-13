"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await signOut({ callbackUrl: "/admin/login" });
      }}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white disabled:opacity-60 ${compact ? "justify-center" : ""}`}
    >
      <LogOut size={17} aria-hidden="true" />
      <span>{pending ? "Signing out…" : "Sign out"}</span>
    </button>
  );
}
