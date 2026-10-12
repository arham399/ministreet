import { CONTACT_EMAIL } from "@/lib/constants";

export const metadata = { title: "Returns & Refunds" };

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="section-label mb-2">Customer care</p>
      <h1 className="mb-6 font-display text-3xl font-medium text-[var(--charcoal)] sm:text-4xl">Returns &amp; Refunds</h1>
      <div className="space-y-6 text-sm leading-7 text-[var(--muted)] sm:text-base">
        <p>We want you to love your purchase. If an item arrives damaged or broken, contact us within 48 hours of delivery so we can review the issue.</p>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--charcoal)]">Report a damaged or broken item</h2>
          <p>Please email <a className="link-premium" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> within 48 hours of receiving your parcel. Include clear photos or an unboxing video showing the issue and your order details. We will review your claim and guide you through the return.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--charcoal)]">Return first, refund next</h2>
          <p>Where a return is approved, the item must be sent back in its original packaging. Refunds are processed after we receive the returned parcel and verify the reported issue. Please allow 2–5 working days for processing after verification.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--charcoal)]">Refund exclusions</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Delivery charges are non-refundable.</li>
            <li>Items damaged due to misuse are not eligible for a refund.</li>
            <li>Claims reported after 48 hours of delivery are outside the stated reporting window.</li>
          </ul>
        </section>

        <p>For help with a return or refund, contact us at <a className="link-premium" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </div>
    </main>
  );
}
