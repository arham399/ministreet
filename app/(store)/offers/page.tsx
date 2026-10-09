import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Offers" };

export default function OffersPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-3">The Cutest Deals Are Here</h1>
      <p className="text-[var(--muted)] mb-8 max-w-md mx-auto">
        Active offers are managed from the admin panel. Check back for limited-time promotions.
      </p>
      <Button asChild>
        <Link href="/shop">Shop Collection</Link>
      </Button>
    </div>
  );
}
