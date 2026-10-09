"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { INSTAGRAM_URL } from "@/lib/constants";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        orderNumber: form.get("orderNumber") || null,
        subject: form.get("subject"),
        message: form.get("message"),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to send");
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-16">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-2">Get in Touch</h1>
      <p className="text-[var(--muted)] mb-10">We&apos;re here to help.</p>
      <div className="grid md:grid-cols-2 gap-10">
        <div>
          {sent ? (
            <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--brand-blush)] text-center">
              <p className="font-medium text-[var(--charcoal)]">Message sent 💗</p>
              <p className="text-sm text-[var(--muted)] mt-1">We&apos;ll get back to you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="name">Name</label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="email">Email</label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="orderNumber">Order number (optional)</label>
                <Input id="orderNumber" name="orderNumber" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="subject">Subject</label>
                <Input id="subject" name="subject" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  className="flex w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)]"
                />
              </div>
              {error && <p className="text-sm text-[var(--error)]">{error}</p>}
              <Button type="submit" disabled={loading}>
                {loading ? "Sending…" : "Send Message"}
              </Button>
            </form>
          )}
        </div>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold mb-1">Email</h3>
            <p className="text-[var(--muted)]">STORE_EMAIL</p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Phone / WhatsApp</h3>
            <p className="text-[var(--muted)]">STORE_PHONE</p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Instagram</h3>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-[var(--brand-pink)] hover:underline">
              @mini_street.co
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
