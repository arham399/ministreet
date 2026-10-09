import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--brand-cream)]">
      <div className="py-6 flex justify-center">
        <Link href="/">
          <Image src="/brand/logo.png" alt="Mini Street" width={100} height={40} className="h-9 w-auto" />
        </Link>
      </div>
      {children}
    </div>
  );
}
