"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Request failed");
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-display text-3xl font-semibold mb-2">Forgot password</h1>
        {sent ? (
          <p className="text-sm text-[var(--muted)] mb-6">
            If an account exists with that email, a reset link has been sent. Check your inbox (and spam).
          </p>
        ) : (
          <>
            <p className="text-sm text-[var(--muted)] mb-6">
              Enter your email and we&apos;ll send a reset link.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="email">Email</label>
                <Input id="email" name="email" type="email" required />
              </div>
              {error && <p className="text-sm text-[var(--error)]">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          </>
        )}
        <Link href="/login" className="inline-block mt-6 text-sm text-[var(--brand-pink)] hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
