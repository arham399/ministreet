import { asc, eq } from "drizzle-orm";
import { CATEGORIES } from "@/lib/constants";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { category } from "@/lib/db/drizzle/schema";

export type StoreCategory = { id?: string; name: string; slug: string };

export async function getStoreCategories(): Promise<StoreCategory[]> {
  try {
    return await getDrizzleClient().db.select({ id: category.id, name: category.name, slug: category.slug })
      .from(category).where(eq(category.isActive, true)).orderBy(asc(category.displayOrder), asc(category.name));
  } catch {
    return CATEGORIES.map(({ name, slug }) => ({ name, slug }));
  }
}
