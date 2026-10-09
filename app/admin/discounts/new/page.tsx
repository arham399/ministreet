"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewDiscountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        type: form.get("type"),
        value: Number(form.get("value")),
        scope: form.get("scope"),
        minOrderAmount: form.get("minOrderAmount") ? Number(form.get("minOrderAmount")) : null,
        isActive: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      setLoading(false);
      return;
    }
    router.push("/admin/discounts");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Add discount</h1>
      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Name</label>
          <Input name="name" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Scope</label>
            <select name="scope" className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] px-3 text-sm bg-white">
              <option value="STOREWIDE">Store-wide</option>
              <option value="CATEGORY">Category</option>
              <option value="PRODUCT">Product</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Type</label>
            <select name="type" className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] px-3 text-sm bg-white">
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED_AMOUNT">Fixed amount</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Value</label>
          <Input name="value" type="number" required min={1} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Min order (optional)</label>
          <Input name="minOrderAmount" type="number" />
        </div>
        {error && <p className="text-sm text-[var(--error)]">{error}</p>}
        <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Create"}</Button>
      </form>
    </div>
  );
}
