"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    const confirm = String(form.get("confirm"));
    if (password !== confirm) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password,
        phone: form.get("phone") || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }
    await signIn("credentials", {
      email: form.get("email"),
      password,
      redirect: false,
    });
    router.push("/account");
    router.refresh();
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-semibold text-center mb-2">Create account</h1>
        <p className="text-center text-sm text-[var(--muted)] mb-8">
          Join Mini Street — optional, checkout works without an account
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="name">Name</label>
            <Input id="name" name="name" required autoComplete="name" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="email">Email</label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="phone">Phone (optional)</label>
            <Input id="phone" name="phone" type="tel" autoComplete="tel" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="password">Password</label>
            <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="confirm">Confirm password</label>
            <Input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
          </div>
          {error && <p className="text-sm text-[var(--error)]">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </Button>
        </form>
        <p className="text-center text-sm text-[var(--muted)] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--brand-pink)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
