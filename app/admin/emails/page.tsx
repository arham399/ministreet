import { count, desc } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { emailLog } from "@/lib/db/drizzle/schema";
import { TablePagination } from "@/components/admin/table-pagination";

export const metadata = { title: "Emails | Admin" };

const PAGE_SIZE = 25;

export default async function AdminEmailsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  let total = 0;
  let logs: {
    id: string;
    to: string;
    subject: string;
    template: string;
    status: string;
    createdAt: Date;
  }[] = [];
  try {
    const { db } = getDrizzleClient();
    const [totalRows, rows] = await Promise.all([
      db.select({ value: count() }).from(emailLog),
      db.select().from(emailLog).orderBy(desc(emailLog.createdAt))
        .limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    ]);
    total = totalRows[0]?.value ?? 0;
    logs = rows;
  } catch { /* */ }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Email log</h1>
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white overflow-x-auto">
        <table className="admin-data-table w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
              <th className="px-4 py-3">To</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Template</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--muted)]">No emails logged yet</td></tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="border-b border-[var(--border)] last:border-0">
                  <td data-label="Recipient" className="px-4 py-3">{l.to}</td>
                  <td data-label="Subject" className="px-4 py-3">{l.subject}</td>
                  <td data-label="Template" className="px-4 py-3 text-[var(--muted)]">{l.template}</td>
                  <td data-label="Status" className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${l.status === "SENT" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                      {l.status}
                    </span>
                  </td>
                  <td data-label="Date" className="px-4 py-3 text-[var(--muted)]">{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <TablePagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/emails" />
      </div>
    </div>
  );
}
