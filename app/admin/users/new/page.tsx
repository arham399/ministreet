"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        role: form.get("role"),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      setLoading(false);
      return;
    }
    router.push("/admin/users");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Add staff user</h1>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Name</label>
          <Input name="name" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <Input name="email" type="email" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Password</label>
          <Input name="password" type="password" required minLength={8} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Role</label>
          <select name="role" className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] px-3 text-sm bg-white">
            <option value="ADMIN">ADMIN</option>
            <option value="ORDER_MANAGER">ORDER_MANAGER</option>
            <option value="INVENTORY_MANAGER">INVENTORY_MANAGER</option>
            <option value="SUPPORT">SUPPORT</option>
          </select>
        </div>
        {error && <p className="text-sm text-[var(--error)]">{error}</p>}
        <Button type="submit" disabled={loading}>{loading ? "Creating…" : "Create user"}</Button>
      </form>
    </div>
  );
}
