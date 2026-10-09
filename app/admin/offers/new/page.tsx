"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewOfferPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description") || null,
        imageUrl: form.get("imageUrl") || null,
        linkUrl: form.get("linkUrl") || null,
        startsAt: form.get("startsAt") || null,
        endsAt: form.get("endsAt") || null,
        isActive: true,
      }),
    });
    router.push("/admin/offers");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Add offer</h1>
      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Title</label>
          <Input name="title" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea name="description" rows={3} className="w-full rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Image URL</label>
          <Input name="imageUrl" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Link URL</label>
          <Input name="linkUrl" placeholder="/shop" />
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
        <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Create offer"}</Button>
      </form>
    </div>
  );
}
