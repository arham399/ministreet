export const metadata = { title: "FAQs" };

const FAQS = [
  { cat: "Orders", q: "How do I place an order?", a: "Browse our collection, add items to your cart, and proceed to checkout. Cash on Delivery is available." },
  { cat: "Orders", q: "Can I modify my order?", a: "Please contact us as soon as possible. Once an order is packed, changes may not be possible." },
  { cat: "Shipping", q: "How long does delivery take?", a: "Delivery times vary by city. Track your order using the tracking ID provided after checkout." },
  { cat: "Shipping", q: "How can I track my order?", a: "Use the Track Order page and enter your order or tracking ID (e.g. MS-2026-000184)." },
  { cat: "Payments", q: "What payment methods do you accept?", a: "Currently Cash on Delivery. More options (JazzCash, Easypaisa, card) are coming soon." },
  { cat: "Returns", q: "What is the return policy?", a: "Please see our Returns Policy page for current terms. Contact us if you have any issues with your order." },
  { cat: "Products", q: "Are the products real gold?", a: "Please check individual product descriptions. We do not invent material claims — details are provided by the owner." },
  { cat: "Tracking", q: "I didn't receive a tracking ID", a: "Check your email (and spam folder). You can also contact us with your order details." },
];

export default function FaqPage() {
  const cats = [...new Set(FAQS.map((f) => f.cat))];
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-2">Frequently Asked Questions</h1>
      <p className="text-[var(--muted)] mb-10">Find answers about orders, shipping, and more.</p>
      {cats.map((cat) => (
        <div key={cat} className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-pink)] mb-3">{cat}</h2>
          <div className="space-y-3">
            {FAQS.filter((f) => f.cat === cat).map((f) => (
              <details key={f.q} className="group rounded-[var(--radius-md)] border border-[var(--border)] bg-white">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium flex justify-between items-center">
                  {f.q}
                  <span className="text-[var(--muted)] group-open:rotate-45 transition-transform text-lg leading-none">+</span>
                </summary>
                <div className="px-4 pb-4 text-sm text-[var(--muted)] leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
