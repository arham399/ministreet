import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Emails | Admin" };

export default async function AdminEmailsPage() {
  let logs: {
    id: string;
    to: string;
    subject: string;
    template: string;
    status: string;
    createdAt: Date;
  }[] = [];
  try {
    logs = await prisma.emailLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch { /* */ }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Email log</h1>
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white overflow-x-auto">
        <table className="w-full text-sm">
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
                  <td className="px-4 py-3">{l.to}</td>
                  <td className="px-4 py-3">{l.subject}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{l.template}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${l.status === "SENT" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
