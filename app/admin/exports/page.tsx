import { auth } from "@/lib/auth/config";
import { can } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";

export const metadata = { title: "Database exports | Admin" };

export default async function DatabaseExportsPage() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "analytics:read")) redirect("/admin");
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold">Database exports</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Download a snapshot of the application’s database tables for record keeping. Authentication accounts, sessions, verification tokens, password hashes, and private payment proof paths are excluded. Treat exported customer and order information as confidential.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <a href="/api/admin/exports?format=xls" className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-5 transition hover:border-[var(--brand-pink)] hover:shadow-soft">
          <h2 className="font-semibold">Export Excel workbook (.xls)</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">All application tables, each on its own worksheet.</p>
          <span className="mt-4 inline-flex rounded-full bg-[var(--brand-pink)] px-4 py-2 text-sm font-semibold text-white">Download Excel export</span>
        </a>
        <a href="/api/admin/exports?format=pdf" className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-5 transition hover:border-[var(--brand-pink)] hover:shadow-soft">
          <h2 className="font-semibold">Export PDF report (.pdf)</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">A printable, paginated text report of the same tables.</p>
          <span className="mt-4 inline-flex rounded-full bg-[var(--brand-pink)] px-4 py-2 text-sm font-semibold text-white">Download PDF export</span>
        </a>
      </div>
      <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">These exports may contain customer contact, address, order, and business records. Store downloaded copies securely and delete them when no longer needed.</p>
    </div>
  );
}
