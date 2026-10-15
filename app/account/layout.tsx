import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { getStoreCategories } from "@/lib/db/drizzle/queries/categories";
import { getStoreSettings } from "@/lib/settings/store-settings";
import { ShippingSettingsProvider } from "@/components/providers/shipping-settings-provider";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const [categories, settings] = await Promise.all([
    getStoreCategories(),
    getStoreSettings(),
  ]);
  return (
    <ShippingSettingsProvider settings={settings}>
      <AnnouncementBar settings={settings} />
      <SiteHeader categories={categories} />
      <main className="min-h-[60vh]">{children}</main>
      <SiteFooter categories={categories} />
    </ShippingSettingsProvider>
  );
}
