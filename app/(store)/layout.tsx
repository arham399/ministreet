import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { getStoreCategories } from "@/lib/db/drizzle/queries/categories";
import { getStoreSettings } from "@/lib/settings/store-settings";
import { ShippingSettingsProvider } from "@/components/providers/shipping-settings-provider";
import { FirstVisitNotice } from "@/components/layout/first-visit-notice";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, settings] = await Promise.all([
    getStoreCategories(),
    getStoreSettings(),
  ]);
  return (
    <ShippingSettingsProvider settings={settings}>
      <AnnouncementBar settings={settings} />
      <SiteHeader categories={categories} />
      <FirstVisitNotice />
      <main className="min-h-[60vh]">{children}</main>
      <SiteFooter categories={categories} />
    </ShippingSettingsProvider>
  );
}
