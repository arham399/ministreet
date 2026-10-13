"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";

export function NewsletterCampaignForm({ activeCount }: { activeCount: number }) {
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [subject, setSubject] = useState("");
  const [campaignMessage, setCampaignMessage] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [includeButton, setIncludeButton] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [validationError, setValidationError] = useState("");

  function updateValue(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    setValue: (value: string) => void
  ) {
    setValue(event.target.value);
  }

  function resetComposer() {
    setSubject("");
    setCampaignMessage("");
    setButtonText("");
    setButtonUrl("");
    setIncludeButton(true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    setValidationError("");

    if (subject.trim().length < 3 || subject.trim().length > 160) {
      setValidationError("Subject must be between 3 and 160 characters.");
      return;
    }
    if (campaignMessage.trim().length < 10 || campaignMessage.trim().length > 5000) {
      setValidationError("Message must be between 10 and 5,000 characters.");
      return;
    }
    if (includeButton) {
      if (buttonText.trim().length < 2 || buttonText.trim().length > 40) {
        setValidationError("Button text must be between 2 and 40 characters.");
        return;
      }
      if (!isValidButtonUrl(buttonUrl.trim())) {
        setValidationError("Use a site path like /product/pearl-earrings or a secure https:// link.");
        return;
      }
    }

    if (activeCount === 0) {
      setIsError(true);
      setMessage("There are no active subscribers to send this newsletter to.");
      return;
    }

    setIsConfirmOpen(true);
  }

  function isValidButtonUrl(value: string) {
    if (value.startsWith("/") && !value.startsWith("//")) {
      return !value.includes("\\") && !/[\u0000-\u001f]/.test(value);
    }
    try {
      const url = new URL(value);
      return (
        !url.username &&
        !url.password &&
        (url.protocol === "https:" || url.origin === window.location.origin)
      );
    } catch {
      return false;
    }
  }

  async function sendNewsletter() {
    setIsSending(true);
    try {
      const response = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          message: campaignMessage,
          buttonText: includeButton ? buttonText : "",
          buttonUrl: includeButton ? buttonUrl : "",
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setIsError(true);
        if (result.fieldErrors) {
          setValidationError(result.error || "Check the newsletter fields and try again.");
          setMessage("");
        } else {
          setMessage(
            result.sent != null
              ? `${result.sent} delivered, ${result.failed} failed. See Admin → Email log for details.`
              : result.error || "The newsletter could not be sent."
          );
        }
        setIsConfirmOpen(false);
        return;
      }

      setMessage(`Newsletter sent to ${result.sent} active subscriber${result.sent === 1 ? "" : "s"}.`);
      resetComposer();
      setIsConfirmOpen(false);
    } catch {
      setIsError(true);
      setMessage("The send request failed. Check the email log before retrying to avoid duplicate sends.");
      setIsConfirmOpen(false);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Email subject</span>
        <input
          name="subject"
          type="text"
          required
          minLength={3}
          maxLength={160}
          placeholder="New arrivals have landed!"
          value={subject}
          onChange={(event) => updateValue(event, setSubject)}
          className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3 text-sm focus:border-[var(--brand-pink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)]/20"
        />
        <span className="mt-1 block text-xs text-[var(--muted)]">
          {subject.trim().length}/160 characters · minimum 3
        </span>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Newsletter message</span>
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={8}
          placeholder={"Tell subscribers about new products, special offers, or store news.\n\nSeparate paragraphs with a blank line."}
          value={campaignMessage}
          onChange={(event) => updateValue(event, setCampaignMessage)}
          className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3 py-2.5 text-sm leading-relaxed focus:border-[var(--brand-pink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)]/20"
        />
        <span className="mt-1 block text-xs text-[var(--muted)]">
          Plain text only. Each paragraph will be formatted for the email. {campaignMessage.trim().length}/5,000 characters · minimum 10.
        </span>
      </label>
      <label className="flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={includeButton}
          onChange={(event) => setIncludeButton(event.target.checked)}
          className="mt-0.5 accent-[var(--brand-pink)]"
        />
        <span>
          <span className="block font-medium">Include a call-to-action button</span>
          <span className="mt-0.5 block text-xs text-[var(--muted)]">
            Turn this off to send a message-only newsletter.
          </span>
        </span>
      </label>
      {includeButton && <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Button text</span>
          <input
            name="buttonText"
            type="text"
            required
            minLength={2}
            maxLength={40}
            value={buttonText}
            onChange={(event) => updateValue(event, setButtonText)}
            placeholder="Shop the offer"
            className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3 text-sm focus:border-[var(--brand-pink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)]/20"
          />
          <span className="mt-1 block text-xs text-[var(--muted)]">
            {buttonText.trim().length}/40 characters · minimum 2
          </span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Button link</span>
          <input
            name="buttonUrl"
            type="text"
            required
            maxLength={2048}
            value={buttonUrl}
            onChange={(event) => updateValue(event, setButtonUrl)}
            placeholder="/offers/summer-sale"
            aria-describedby="newsletter-button-url-help"
            className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3 text-sm focus:border-[var(--brand-pink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)]/20"
          />
          <span id="newsletter-button-url-help" className="mt-1 block text-xs text-[var(--muted)]">
            Use a site path such as /offers/sale or a secure https:// link.
          </span>
        </label>
      </div>}
      <section aria-label="Newsletter email preview" className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[#fff8fb]">
        <div className="border-b border-[var(--border)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Email preview
        </div>
        <div className="mx-auto max-w-xl p-4 sm:p-6">
          <div className="rounded-xl border border-[#f3dce9] bg-white shadow-soft">
            <div className="rounded-t-xl bg-[var(--brand-pink)] px-4 py-5 text-center text-white">
              <p className="font-display text-2xl font-semibold tracking-wide">MINI STREET</p>
              <p className="mt-1 text-[10px] tracking-[0.25em]">ADORABLY ENCHANTING TREASURES</p>
            </div>
            <div className="px-5 py-6 sm:px-7">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--brand-pink)]">
                A note from Mini Street
              </p>
              <h3 className="mb-4 break-words font-display text-2xl text-[var(--charcoal)]">
                {subject || "Your newsletter subject"}
              </h3>
              <div className="min-h-12 whitespace-pre-wrap break-words text-sm leading-7 text-[var(--muted)]">
                {campaignMessage || "Your message will appear here as you write it."}
              </div>
              {includeButton && (
                <div className="mt-7 flex justify-center">
                  <span className="inline-block max-w-full break-words rounded-lg bg-[var(--brand-pink)] px-7 py-3.5 text-center text-sm font-semibold text-white shadow-soft">
                    {buttonText || "Your button text"}
                  </span>
                </div>
              )}
              <p className="mt-6 border-t border-[var(--border)] pt-4 text-center text-xs leading-5 text-[var(--muted)]">
                With love, Mini Street
                <br />
                You received this because you joined the Mini Street Club. Every campaign includes an unsubscribe link.
              </p>
            </div>
          </div>
          {includeButton && buttonUrl && (
            <p className="mt-2 break-all text-center text-xs text-[var(--muted)]">
              Button destination: {buttonUrl}
            </p>
          )}
        </div>
      </section>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSending || activeCount === 0}
          className="rounded-[var(--radius-sm)] bg-[var(--brand-pink)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-pink-deep)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSending ? "Sending newsletter..." : `Send to ${activeCount} active subscriber${activeCount === 1 ? "" : "s"}`}
        </button>
        <p role="status" aria-live="polite" className={`text-sm ${isError ? "text-red-600" : "text-green-700"}`}>
          {message}
        </p>
      </div>
      {validationError && (
        <p role="alert" className="text-sm text-red-600">
          {validationError}
        </p>
      )}
      <AlertDialog.Root open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-[#21151d]/55 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in" />
          <AlertDialog.Content className="admin-dialog fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#f3dce9] bg-white shadow-2xl focus:outline-none">
            <div className="bg-gradient-to-r from-[var(--brand-pink)] to-[#c81773] px-6 py-5 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/80">
                Mini Street Club
              </p>
              <AlertDialog.Title className="mt-1 font-display text-2xl font-semibold">
                Ready to send?
              </AlertDialog.Title>
            </div>
            <div className="space-y-4 p-6">
              <AlertDialog.Description className="text-sm leading-6 text-[var(--muted)]">
                This newsletter will be emailed individually to{" "}
                <strong className="font-semibold text-[var(--charcoal)]">
                  {activeCount} active subscriber{activeCount === 1 ? "" : "s"}
                </strong>
                . Please review the campaign details before sending.
              </AlertDialog.Description>
              <div className="rounded-xl border border-[var(--border)] bg-[#fff8fb] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Email subject
                </p>
                <p className="mt-1 break-words text-sm font-semibold text-[var(--charcoal)]">
                  {subject}
                </p>
                <p className="mt-3 text-xs text-[var(--muted)]">
                  {includeButton
                    ? `Includes “${buttonText}” button → ${buttonUrl}`
                    : "Message only · no call-to-action button"}
                </p>
              </div>
              <p className="text-xs leading-5 text-[var(--muted)]">
                This action sends the campaign now. Every email includes an unsubscribe link.
              </p>
              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <AlertDialog.Cancel asChild>
                  <button
                    type="button"
                    disabled={isSending}
                    className="h-10 rounded-lg border border-[var(--border)] px-4 text-sm font-medium text-[var(--charcoal)] transition-colors hover:bg-[#fff8fb] disabled:opacity-60"
                  >
                    Keep editing
                  </button>
                </AlertDialog.Cancel>
                <button
                  type="button"
                  onClick={sendNewsletter}
                  disabled={isSending}
                  className="h-10 rounded-lg bg-[var(--brand-pink)] px-4 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-[var(--brand-pink-deep)] disabled:cursor-wait disabled:opacity-70"
                >
                  {isSending ? "Sending..." : "Send newsletter"}
                </button>
              </div>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </form>
  );
}
