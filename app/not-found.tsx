import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl mb-4">✨</p>
      <h1 className="font-display text-3xl font-semibold mb-2">Page not found</h1>
      <p className="text-[var(--muted)] mb-6">This little treasure seems to have wandered off.</p>
      <Button asChild>
        <Link href="/">Back home</Link>
      </Button>
    </div>
  );
}
