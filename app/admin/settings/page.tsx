import { Instagram, Mail, ShieldCheck, Store, Truck } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { can } from "@/lib/auth/permissions";
import { ShippingSettingsForm } from "./shipping-settings-form";
import { getStoreSettings } from "@/lib/settings/store-settings";
import { INSTAGRAM_URL } from "@/lib/constants";

export const metadata = { title: "Settings | Admin" };

function formatAmount(value: number) {
  return value.toLocaleString("en-PK", { maximumFractionDigits: 2 });
}

export default async function AdminSettingsPage() {
  const [session, settings] = await Promise.all([auth(), getStoreSettings()]);
  const mayManageSettings = can(session?.user?.role, "settings:write");

  return (
    <div className="mx-auto max-w-5xl">
      <div className="admin-page-heading mb-7">
        <div>
          <p className="admin-eyebrow">Store control center</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[#342a32]">Settings</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#827680]">Manage delivery pricing and the announcement message shown to your customers.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(16rem,.8fr)] lg:items-start">
        <div className="space-y-5">
          {mayManageSettings ? (
            <ShippingSettingsForm
              initialDefaultShippingCost={settings.defaultShippingCost}
              initialFreeShippingThreshold={settings.freeShippingThreshold}
              initialAnnouncementText={settings.announcementText}
            />
          ) : (
            <section className="rounded-3xl border border-[#efe3ea] bg-white p-5 shadow-soft sm:p-7">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-[#fceaf3] text-[#c2186b]"><Truck size={20} /></span>
                <div><p className="admin-eyebrow">Delivery experience</p><h2 className="font-display text-xl font-semibold">Shipping &amp; delivery</h2></div>
              </div>
              <dl className="mt-5 divide-y divide-[#f2e9ee]">
                <div className="flex items-center justify-between gap-4 py-3 text-sm"><dt className="text-[#827680]">Default delivery charge</dt><dd className="font-semibold tabular-nums">Rs. {formatAmount(settings.defaultShippingCost)}</dd></div>
                <div className="flex items-center justify-between gap-4 py-3 text-sm"><dt className="text-[#827680]">Free delivery from</dt><dd className="font-semibold tabular-nums">Rs. {formatAmount(settings.freeShippingThreshold)}</dd></div>
              </dl>
              <p className="mt-3 text-xs text-[#91858e]">You need store settings permission to make changes.</p>
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-[#efe3ea] bg-white p-5 shadow-[0_14px_40px_rgba(72,40,59,.05)] sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-[#f2effa] text-[#8565a4]"><Store size={19} /></span>
              <div><p className="admin-eyebrow">Customer-facing</p><h2 className="font-display text-xl font-semibold">Store details</h2></div>
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail size={16} className="mt-0.5 shrink-0 text-[#a17d91]" />
                <div className="min-w-0"><dt className="text-xs text-[#91858e]">Support email</dt><dd className="mt-0.5 break-all font-medium text-[#342a32]">{settings.storeEmail}</dd></div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#a17d91]" />
                <div className="min-w-0"><dt className="text-xs text-[#91858e]">Support phone</dt><dd className="mt-0.5 font-medium text-[#342a32]">{settings.storePhone}</dd></div>
              </div>
              <div className="flex items-start gap-3">
                <Instagram size={16} className="mt-0.5 shrink-0 text-[#a17d91]" />
                <div className="min-w-0"><dt className="text-xs text-[#91858e]">Instagram</dt><dd className="mt-0.5"><a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="font-medium text-[#c2186b] hover:underline">@mini_street.co</a></dd></div>
              </div>
            </dl>
            <p className="mt-5 rounded-xl bg-[#faf7f9] px-3.5 py-3 text-xs leading-5 text-[#827680]">Your delivery offer is shown in the storefront announcement, cart, checkout, and shipping policy.</p>
          </section>

          <section className="rounded-3xl border border-[#efe3ea] bg-gradient-to-br from-[#fff8fc] to-[#f8f5fb] p-5 sm:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#a17d91]">Current delivery offer</p>
            <p className="mt-3 font-display text-2xl font-semibold text-[#342a32]">Free shipping</p>
            <p className="mt-1 text-sm text-[#827680]">when customers spend</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-[#c2186b]">Rs. {formatAmount(settings.freeShippingThreshold)}+</p>
            <div className="mt-5 flex items-center justify-between border-t border-[#eadde5] pt-4 text-sm">
              <span className="text-[#827680]">Otherwise</span>
              <span className="font-semibold text-[#342a32]">Rs. {formatAmount(settings.defaultShippingCost)} delivery</span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
