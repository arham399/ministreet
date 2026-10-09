"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TrackOrderPage() {
  const [id, setId] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = id.trim();
    if (trimmed) {
      router.push(`/track-order/${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:py-24 text-center">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--charcoal)] mb-3">
        Track Your Order
      </h1>
      <p className="text-sm text-[var(--muted)] mb-8">
        Enter your order number or tracking ID (e.g. MS-2026-000184)
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <Input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="MS-2026-000184"
          aria-label="Order or tracking ID"
          className="flex-1"
        />
        <Button type="submit">Track Order</Button>
      </form>
    </div>
  );
}
