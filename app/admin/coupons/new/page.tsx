"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewCouponPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.get("code"),
        type: form.get("type"),
        value: Number(form.get("value")),
        minOrderAmount: form.get("minOrderAmount") ? Number(form.get("minOrderAmount")) : null,
        maxDiscount: form.get("maxDiscount") ? Number(form.get("maxDiscount")) : null,
        usageLimit: form.get("usageLimit") ? Number(form.get("usageLimit")) : null,
        startsAt: form.get("startsAt") || null,
        endsAt: form.get("endsAt") || null,
        isActive: form.get("isActive") === "on",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      setLoading(false);
      return;
    }
    router.push("/admin/coupons");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Add coupon</h1>
      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Code</label>
          <Input name="code" required placeholder="SAVE10" className="uppercase" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Type</label>
            <select name="type" className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] px-3 text-sm bg-white">
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED_AMOUNT">Fixed amount</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Value</label>
            <Input name="value" type="number" required min={1} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Min order (optional)</label>
            <Input name="minOrderAmount" type="number" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Max discount (optional)</label>
            <Input name="maxDiscount" type="number" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Usage limit (optional)</label>
          <Input name="usageLimit" type="number" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Starts</label>
            <Input name="startsAt" type="datetime-local" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Ends</label>
            <Input name="endsAt" type="datetime-local" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked /> Active
        </label>
        {error && <p className="text-sm text-[var(--error)]">{error}</p>}
        <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Create coupon"}</Button>
      </form>
    </div>
  );
}
