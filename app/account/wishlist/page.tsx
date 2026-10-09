import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Wishlist" };

export default async function AccountWishlistPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="mx-auto max-w-lg px-4 py-12 text-center">
      <h1 className="font-display text-3xl font-semibold mb-3">Wishlist</h1>
      <p className="text-[var(--muted)] mb-6">Your saved pieces will appear here.</p>
      <Button asChild>
        <Link href="/shop">Browse shop</Link>
      </Button>
    </div>
  );
}
