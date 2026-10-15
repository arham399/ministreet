"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound } from "lucide-react";

export default function AccountCredentialsForm({
  currentEmail,
}: {
  currentEmail: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(currentEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (newPassword && newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          email,
          ...(newPassword ? { newPassword } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Could not update account credentials");
        setSaving(false);
        return;
      }

      await signOut({ redirect: false });
      router.replace("/admin/login?credentialsUpdated=1");
      router.refresh();
    } catch {
      setError("Could not update account credentials. Please try again.");
      setSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-[#efe3ea] bg-white shadow-[0_14px_40px_rgba(72,40,59,.05)]">
      <div className="flex items-start gap-3 border-b border-[#f2e9ee] bg-gradient-to-br from-white to-[#fbf7fa] px-5 py-5 sm:px-7">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#f2effa] text-[#8565a4]"><KeyRound size={19} /></span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#a17d91]">Account security</p>
          <h2 className="mt-1 font-display text-xl font-semibold text-[#342a32]">Admin sign-in</h2>
          <p className="mt-1 text-sm leading-6 text-[#827680]">
        Change the email used to sign in or set a new password. Your current password is required.
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5 sm:px-7 sm:py-6">
        <div>
          <label htmlFor="account-email" className="mb-1.5 block text-sm font-medium">Sign-in email</label>
          <Input
            id="account-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="current-password" className="mb-1.5 block text-sm font-medium">Current password</label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium">New password</label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={100}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <p className="mt-1 text-xs text-[var(--muted)]">Leave blank if you only want to change your email.</p>
        </div>
        {newPassword && (
          <div>
            <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium">Confirm new password</label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
        )}
        {error && <p role="alert" className="text-sm text-[var(--error)]">{error}</p>}
        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? "Saving…" : "Update sign-in details"}
        </Button>
      </form>
    </section>
  );
}
