import { CATEGORIES } from "@/lib/constants";

export const metadata = { title: "Categories | Admin" };

export default function AdminCategoriesPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Categories</h1>
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white overflow-hidden shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Order</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((c, i) => (
              <tr key={c.slug} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-[var(--muted)]">{c.slug}</td>
                <td className="px-4 py-3">{i + 1}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
