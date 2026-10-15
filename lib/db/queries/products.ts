import {
  getBestSellersWithDrizzle,
  getProductBySlugWithDrizzle,
  getProductPriceCeilingWithDrizzle,
  getProductsWithDrizzle,
} from "@/lib/db/drizzle/queries/products";

export type { ProductListFilters } from "@/lib/db/drizzle/queries/products";

export const getProductPriceCeiling = getProductPriceCeilingWithDrizzle;
export const getProducts = getProductsWithDrizzle;
export const getProductBySlug = getProductBySlugWithDrizzle;

export async function getNewArrivals(limit?: number) {
  return getProductsWithDrizzle({ newArrival: true, ...(limit == null ? { all: true } : { limit }), sort: "newest" });
}

export async function getFeaturedProducts() {
  return getProductsWithDrizzle({ featuredOnly: true, all: true, sort: "featured" });
}

export const getBestSellers = getBestSellersWithDrizzle;
