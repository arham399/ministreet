"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewsletterSubscriberStatus({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  async function updateStatus() {
    setIsUpdating(true);
    setError("");
    try {
      const response = await fetch("/api/admin/newsletter", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Could not update subscriber.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not update subscriber. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className={isActive ? "text-green-700" : "text-[var(--muted)]"}>
        {isActive ? "Active" : "Unsubscribed"}
      </span>
      <button
        type="button"
        onClick={updateStatus}
        disabled={isUpdating}
        className="rounded border border-[var(--border)] px-2.5 py-1 text-xs hover:border-[var(--brand-pink)] hover:text-[var(--brand-pink)] disabled:opacity-60"
      >
        {isUpdating ? "Saving..." : isActive ? "Unsubscribe" : "Reactivate"}
      </button>
      {error && <span role="alert" className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
