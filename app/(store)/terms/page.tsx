export const metadata = { title: "Terms of Service" };

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16 prose prose-sm">
      <h1 className="font-display text-3xl font-semibold text-[var(--charcoal)] mb-6">Terms of Service</h1>
      <p className="text-[var(--muted)] leading-relaxed mb-4">
        This page is configurable by the store owner. Replace this placeholder with your official Terms of Service content.
      </p>
      <p className="text-sm text-[var(--muted)]">
        Contact us at STORE_EMAIL if you have questions.
      </p>
    </div>
  );
}
