import { auth } from "@/lib/auth/config";
import { can } from "@/lib/auth/permissions";
import AccountCredentialsForm from "./account-credentials-form";

export const metadata = { title: "Settings | Admin" };

export default async function AdminSettingsPage() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Settings</h1>
      <div className="max-w-xl space-y-6">
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-5 shadow-soft">
          <h2 className="font-semibold text-sm mb-3">Store details</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-[var(--muted)]">Email</dt><dd>STORE_EMAIL</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--muted)]">Phone</dt><dd>STORE_PHONE</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--muted)]">Instagram</dt><dd>@mini_street.co</dd></div>
          </dl>
          <p className="text-xs text-[var(--muted)] mt-3">Configure via SiteSetting or environment variables.</p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-5 shadow-soft">
          <h2 className="font-semibold text-sm mb-3">Shipping</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-[var(--muted)]">Free shipping over</dt><dd>Rs. 5,000</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--muted)]">Default shipping</dt><dd>Rs. 250</dd></div>
          </dl>
        </div>
        {session?.user && can(session.user.role, "settings:write") && (
          <AccountCredentialsForm currentEmail={session.user.email} />
        )}
      </div>
    </div>
  );
}
