"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewOfferPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const toIso = (value: FormDataEntryValue | null) => value ? new Date(String(value)).toISOString() : null;
    try {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          description: form.get("description") || null,
          imageUrl: form.get("imageUrl") || null,
          linkUrl: form.get("linkUrl") || null,
          startsAt: toIso(form.get("startsAt")),
          endsAt: toIso(form.get("endsAt")),
          isActive: true,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || "We couldn't save this offer. Please check the details and try again.");
        return;
      }
      router.push("/admin/offers");
      router.refresh();
    } catch {
      setError("We couldn't connect to save this offer. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="admin-page-heading mb-6">
        <div><p className="admin-eyebrow">Store merchandising</p><h1 className="text-xl font-semibold">Add offer</h1><p className="mt-1 text-sm text-[var(--muted)]">Create a promotion to display on your storefront Offers page.</p></div>
        <Button asChild variant="outline" size="sm"><Link href="/admin/offers">Back to offers</Link></Button>
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-5 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-soft sm:p-6">
        <div>
          <label htmlFor="title" className="mb-1.5 block text-sm font-medium">Offer title</label>
          <Input id="title" name="title" required minLength={2} maxLength={200} placeholder="e.g. Winter Special" />
        </div>
        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium">Description <span className="font-normal text-[var(--muted)]">(optional)</span></label>
          <textarea id="description" name="description" rows={3} maxLength={2000} className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]" placeholder="A short explanation of this promotion" />
        </div>
        <div>
          <label htmlFor="imageUrl" className="mb-1.5 block text-sm font-medium">Image URL <span className="font-normal text-[var(--muted)]">(optional)</span></label>
          <Input id="imageUrl" name="imageUrl" placeholder="https://… or /images/offer.jpg" />
          <p className="mt-1 text-xs text-[var(--muted)]">Use a secure https link or an image path from this store.</p>
        </div>
        <div>
          <label htmlFor="linkUrl" className="mb-1.5 block text-sm font-medium">Offer link <span className="font-normal text-[var(--muted)]">(optional)</span></label>
          <Input id="linkUrl" name="linkUrl" placeholder="/product/your-product or http://localhost:3000/product/your-product" />
          <p className="mt-1 text-xs text-[var(--muted)]">Use a store path, a localhost URL for testing, or a secure https:// link. Localhost links are saved as store paths so they work after deployment.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startsAt" className="mb-1.5 block text-sm font-medium">Starts <span className="font-normal text-[var(--muted)]">(optional)</span></label>
            <Input id="startsAt" name="startsAt" type="datetime-local" />
          </div>
          <div>
            <label htmlFor="endsAt" className="mb-1.5 block text-sm font-medium">Ends <span className="font-normal text-[var(--muted)]">(optional)</span></label>
            <Input id="endsAt" name="endsAt" type="datetime-local" />
          </div>
        </div>
        <p className="text-xs text-[var(--muted)]">Scheduled offers appear automatically during their selected dates. The times use your local time zone.</p>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
          <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Create offer"}</Button>
          <Button asChild type="button" variant="outline"><Link href="/admin/offers">Cancel</Link></Button>
        </div>
      </form>
    </div>
  );
}
