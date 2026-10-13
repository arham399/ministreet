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

export async function getNewArrivals(limit = 8) {
  return getProductsWithDrizzle({ newArrival: true, limit, sort: "newest" });
}

export const getBestSellers = getBestSellersWithDrizzle;
