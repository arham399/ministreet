import { CONTACT_EMAIL } from "@/lib/constants";

export const metadata = { title: "Shipping Policy" };

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="section-label mb-2">Delivery, made simple</p>
      <h1 className="mb-6 font-display text-3xl font-medium text-[var(--charcoal)] sm:text-4xl">Shipping Policy</h1>
      <div className="space-y-6 text-sm leading-7 text-[var(--muted)] sm:text-base">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--charcoal)]">Delivery charges</h2>
          <p>A flat delivery charge of Rs. 250 applies to orders below Rs. 5,000. Orders of Rs. 5,000 or more qualify for complimentary shipping. The shipping charge or free-shipping offer is shown in your order total at checkout.</p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--charcoal)]">Order delivery</h2>
          <p>Delivery timelines vary by city and courier service. Once your order is dispatched, use the tracking details provided to follow its progress.</p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--charcoal)]">Payment</h2>
          <p>Orders are prepaid. Cash on delivery is not available.</p>
        </section>
        <p>Questions about delivery? Contact us at <a className="link-premium" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </div>
    </main>
  );
}
