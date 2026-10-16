"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await signIn("credentials", {
        email: form.get("email"),
        password: form.get("password"),
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid credentials or not an admin account");
        return;
      }
      router.push(params.get("callbackUrl") || "/admin");
      router.refresh();
    } catch (error) {
      console.error("Admin sign-in request failed:", error);
      setError("Could not reach the sign-in service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f9f2f6] px-4 py-10">
      <div aria-hidden="true" className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-[#f8dceb]/70 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-[#eadcf0]/60 blur-3xl" />
      <div className="relative w-full max-w-[420px] overflow-hidden rounded-[28px] border border-white/80 bg-white/95 p-7 shadow-[0_24px_80px_rgba(79,35,61,.12)] sm:p-10">
        <div className="mb-7 flex flex-col items-center text-center">
          <Image src="/brand/logo.png" alt="Mini Street" width={76} height={76} className="mb-3 h-[68px] w-[68px] rounded-full object-contain" priority />
          <h1 className="font-display text-3xl font-semibold text-[#c2186b]">Mini Street</h1>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[.24em] text-[#a78a9b]">Store administration</p>
        </div>
        <div className="mb-6 border-t border-[#f1e6ec] pt-5 text-center">
          <h2 className="text-lg font-semibold text-[#2b232a]">Welcome back</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Sign in to manage your store</p>
        </div>
        {params.get("credentialsUpdated") === "1" && (
          <p role="status" className="mb-4 text-sm text-green-700">
            Sign-in details updated. Please sign in with your new credentials.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="email">Email</label>
            <Input id="email" name="email" type="email" required autoComplete="username" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="password">Password</label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-3 flex items-center text-[var(--muted)] transition-colors hover:text-[var(--charcoal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)] focus-visible:ring-offset-1"
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-[var(--error)]">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<p className="py-12 text-center text-sm text-[var(--muted)]">Loading…</p>}>
      <AdminLoginForm />
    </Suspense>
  );
}
