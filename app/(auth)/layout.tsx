import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--brand-cream)]">
      <div className="py-6 flex justify-center">
        <Link href="/">
          <span className="font-serif text-2xl font-black leading-none tracking-[-0.055em] text-[var(--brand-pink)]">
            MINI STREET
          </span>
        </Link>
      </div>
      {children}
    </div>
  );
}
