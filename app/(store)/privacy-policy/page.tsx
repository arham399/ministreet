import { CONTACT_EMAIL } from "@/lib/constants";

export const metadata = { title: "Privacy Policy" };

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="section-label mb-2">Your information, treated with care</p>
      <h1 className="mb-2 font-display text-3xl font-medium text-[var(--charcoal)] sm:text-4xl">Privacy Policy</h1>
      <p className="mb-7 text-xs text-[var(--muted)]">Last updated: October 10, 2026</p>

      <div className="space-y-6 text-sm leading-7 text-[var(--muted)] sm:text-base">
        <p>This Privacy Policy explains how Mini Street collects, uses, and protects information when you visit our website, create an account, place an order, subscribe to updates, or contact us.</p>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--charcoal)]">Information we collect</h2>
          <p>Depending on how you use the site, we may collect information you provide, such as your name, email address, phone number, account details, delivery address, order information, newsletter email address, and messages sent through our contact form. We also receive basic technical information needed to operate and secure the site, such as session and request data.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--charcoal)]">How we use information</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>To process and deliver orders, provide order updates, and offer customer support.</li>
            <li>To manage customer accounts, wishlists, and account security.</li>
            <li>To respond to inquiries and handle reported damaged or broken items.</li>
            <li>To send store news to newsletter subscribers. You may contact us to request removal from the mailing list.</li>
            <li>To maintain, protect, and improve the website and prevent misuse.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--charcoal)]">Orders and payment information</h2>
          <p>We use order and contact details to fulfill purchases and provide support. Payment options are presented at checkout. We do not ask you to send payment card or account passwords by email or social media. Payment details, where applicable, are handled by the payment service you choose; that provider’s own privacy terms also apply.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--charcoal)]">When information is shared</h2>
          <p>We share only the information needed with service providers who help operate the store, such as website hosting, order and email systems, and delivery or payment providers. We may also disclose information when required to comply with law or to protect our customers, business, or website. We do not sell personal information.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--charcoal)]">Cookies and security</h2>
          <p>The site may use essential cookies or similar browser storage to support sign-in, sessions, cart features, and security. You can manage cookies through your browser settings, though some site features may not work without them. We use reasonable safeguards to protect information, but no online service can guarantee absolute security.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--charcoal)]">Retention and your choices</h2>
          <p>We keep information for as long as needed to fulfill the purposes described above, maintain transaction records, resolve disputes, and meet applicable obligations. You may ask us to access, correct, or delete information associated with you, or to remove you from marketing emails, by contacting us. Some order records may need to be retained where required for business or legal purposes.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--charcoal)]">Children and policy updates</h2>
          <p>Our store is intended for general customers and is not designed to collect information from children. We may update this policy as our website or practices change; the latest version will be posted on this page with its updated date.</p>
        </section>

        <p>For privacy questions or requests, email <a className="link-premium" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </div>
    </main>
  );
}
