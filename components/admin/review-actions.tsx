"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReviewActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function update(newStatus: string) {
    setLoading(true);
    await fetch("/api/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    router.refresh();
    setLoading(false);
  }

  if (status !== "PENDING") return null;

  return (
    <div className="flex gap-2 shrink-0">
      <button
        type="button"
        disabled={loading}
        onClick={() => update("APPROVED")}
        className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100"
      >
        Approve
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => update("REJECTED")}
        className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100"
      >
        Reject
      </button>
    </div>
  );
}
