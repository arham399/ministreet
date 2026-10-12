"use client";

import { useState, type FormEvent } from "react";

export function NewsletterSignup() {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.get("email") }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || "Unable to subscribe. Please try again.");
        return;
      }

      form.reset();
      setMessage("Thanks for joining the Mini Street Club!");
    } catch {
      setMessage("Unable to subscribe right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form
        className="mx-auto flex w-full max-w-md min-w-0 flex-col gap-2.5 sm:flex-row"
        onSubmit={handleSubmit}
      >
        <input
          type="email"
          name="email"
          placeholder="Your email"
          required
          className="h-12 w-full min-w-0 rounded-[var(--radius-md)] border border-[var(--border)] bg-white/90 px-4 text-sm shadow-soft focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] sm:flex-1"
          aria-label="Email for newsletter"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full shrink-0 rounded-[var(--radius-md)] bg-[var(--brand-pink)] px-7 text-sm font-medium text-white shadow-soft transition-colors hover:bg-[var(--brand-pink-deep)] disabled:cursor-wait disabled:opacity-70 sm:w-auto"
        >
          {isSubmitting ? "Joining..." : "Join"}
        </button>
      </form>
      <p className="mt-3 min-h-5 text-sm text-[var(--muted)]" role="status" aria-live="polite">
        {message}
      </p>
    </>
  );
}
