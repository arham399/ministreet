import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { getStoreCategories } from "@/lib/db/drizzle/queries/categories";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getStoreCategories();
  return (
    <>
      <AnnouncementBar />
      <SiteHeader categories={categories} />
      <main className="min-h-[60vh]">{children}</main>
      <SiteFooter categories={categories} />
    </>
  );
}
