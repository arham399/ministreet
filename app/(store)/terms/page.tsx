import { CONTACT_EMAIL } from "@/lib/constants";

export const metadata = { title: "Terms & Conditions" };

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="section-label mb-2">Please read before ordering</p>
      <h1 className="mb-6 font-display text-3xl font-medium text-[var(--charcoal)] sm:text-4xl">Terms &amp; Conditions</h1>
      <div className="space-y-6 text-sm leading-7 text-[var(--muted)] sm:text-base">
        <p>By placing an order with Mini Street, you agree to the terms below and to the policies linked on our website.</p>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--charcoal)]">Orders and payment</h2>
          <p>Orders are subject to availability and confirmation. Payment must be completed through the payment methods offered at checkout. Cash on delivery is not available. Please provide accurate contact and delivery details when placing an order.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--charcoal)]">Products and pricing</h2>
          <p>We aim to present product descriptions, images, and prices accurately. Minor differences in color or appearance may occur due to screens and photography. Prices and product availability may change; the price shown at checkout applies to your order.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--charcoal)]">Shipping and returns</h2>
          <p>A flat Rs. 250 delivery charge applies to orders below Rs. 5,000; orders of Rs. 5,000 or more qualify for complimentary shipping. Delivery timelines can vary by destination and courier. Shipping charges are non-refundable. If an item arrives damaged or broken, report it within 48 hours of delivery with clear photos or an unboxing video. Approved returns must be sent in original packaging; refunds are issued after we receive and verify the returned parcel, with 2–5 working days allowed for processing. Items damaged through misuse are not eligible for a refund. See our <a href="/return-policy" className="link-premium">Returns &amp; Refunds</a> and <a href="/shipping-policy" className="link-premium">Shipping Policy</a> for details.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--charcoal)]">Contact</h2>
          <p>For questions about these terms or an order, email <a className="link-premium" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
        </section>
      </div>
    </main>
  );
}
