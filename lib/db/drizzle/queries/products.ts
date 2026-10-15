import {
  and,
  asc,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  isNotNull,
  isNull,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import {
  category,
  orderItem,
  product,
  productImage,
  productTag,
  review,
} from "@/lib/db/drizzle/schema";
import { applyAutomaticDiscounts } from "@/lib/discounts/apply-automatic-discounts";
import { getActiveAutomaticDiscountsWithDrizzle } from "@/lib/db/drizzle/queries/discounts";

export type ProductListFilters = {
  category?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
  newArrival?: boolean;
  featuredOnly?: boolean;
  all?: boolean;
  excludeId?: string;
  sort?: string;
  page?: number;
  limit?: number;
};

type ProductWithCategory = {
  product: typeof product.$inferSelect;
  category: typeof category.$inferSelect | null;
};

async function loadProductDetails(productIds: string[]) {
  if (productIds.length === 0) {
    return {
      images: new Map<string, (typeof productImage.$inferSelect)[]>(),
      ratings: new Map<string, number[]>(),
    };
  }

  const { db } = getDrizzleClient();
  const [imageRows, reviewRows] = await Promise.all([
    db
      .select()
      .from(productImage)
      .where(inArray(productImage.productId, productIds))
      .orderBy(asc(productImage.sortOrder), asc(productImage.createdAt)),
    db
      .select({ productId: review.productId, rating: review.rating })
      .from(review)
      .where(
        and(
          inArray(review.productId, productIds),
          eq(review.status, "APPROVED"),
        ),
      ),
  ]);

  const images = new Map<string, (typeof productImage.$inferSelect)[]>();
  for (const image of imageRows) {
    const current = images.get(image.productId) ?? [];
    current.push(image);
    images.set(image.productId, current);
  }

  const ratings = new Map<string, number[]>();
  for (const row of reviewRows) {
    const current = ratings.get(row.productId) ?? [];
    current.push(row.rating);
    ratings.set(row.productId, current);
  }

  return { images, ratings };
}

async function loadColorGroupStats(products: { id: string; colorGroupId: string | null }[]) {
  const groupIds = products
    .filter((item) => item.colorGroupId === item.id)
    .map((item) => item.id);
  if (groupIds.length === 0) return new Map<string, { count: number; stock: number }>();
  const { db } = getDrizzleClient();
  const rows = await db.select({
    groupId: product.colorGroupId,
    stock: product.stockQuantity,
  }).from(product).where(and(
    inArray(product.colorGroupId, groupIds),
    eq(product.isActive, true),
    isNull(product.archivedAt),
  ));
  const stats = new Map<string, { count: number; stock: number }>();
  for (const row of rows) {
    if (!row.groupId) continue;
    const current = stats.get(row.groupId) || { count: 0, stock: 0 };
    stats.set(row.groupId, { count: current.count + 1, stock: current.stock + row.stock });
  }
  return stats;
}

function averageRating(ratings: number[] | undefined) {
  return ratings?.length
    ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
    : null;
}

export async function getProductPriceCeilingWithDrizzle(categorySlug?: string) {
  const { db } = getDrizzleClient();
  const conditions: SQL[] = [
    eq(product.isActive, true),
    isNull(product.archivedAt),
    or(isNull(product.colorGroupId), eq(product.colorGroupId, product.id))!,
  ];
  if (categorySlug) conditions.push(eq(category.slug, categorySlug));

  const [result] = await db
    .select({ maxPrice: sql<string | null>`max(${product.price})` })
    .from(product)
    .leftJoin(category, eq(product.categoryId, category.id))
    .where(and(...conditions));
  return Math.max(1, Math.ceil(Number(result?.maxPrice ?? 0)));
}

export async function getProductsWithDrizzle(filters: ProductListFilters = {}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 24;
  const skip = (page - 1) * limit;
  const priceSensitive =
    filters.minPrice != null ||
    filters.maxPrice != null ||
    filters.onSale === true ||
    filters.sort === "price-low" ||
    filters.sort === "price-high";
  const conditions: SQL[] = [
    eq(product.isActive, true),
    isNull(product.archivedAt),
    or(isNull(product.colorGroupId), eq(product.colorGroupId, product.id))!,
  ];

  if (filters.category) conditions.push(eq(category.slug, filters.category));
  if (filters.excludeId) conditions.push(ne(product.id, filters.excludeId));
  if (filters.inStock) conditions.push(gt(product.stockQuantity, 0));
  if (filters.newArrival) conditions.push(eq(product.isNewArrival, true));
  if (filters.featuredOnly) conditions.push(eq(product.isFeatured, true));
  if (filters.q) {
    const search = `%${filters.q}%`;
    const taggedProductIds = getDrizzleClient().db
      .select({ productId: productTag.productId })
      .from(productTag)
      .where(eq(productTag.name, filters.q.toLowerCase()));
    conditions.push(
      or(
        ilike(product.name, search),
        ilike(product.description, search),
        inArray(product.id, taggedProductIds),
      )!,
    );
  }

  const { db } = getDrizzleClient();
  let sortExpression: SQL = desc(product.createdAt);
  switch (filters.sort) {
    case "price-low":
      sortExpression = asc(product.price);
      break;
    case "price-high":
      sortExpression = desc(product.price);
      break;
    case "newest":
      sortExpression = desc(product.createdAt);
      break;
    case "name":
      sortExpression = asc(product.name);
      break;
    default:
      sortExpression = desc(product.isFeatured);
  }

  const query = db
    .select({ product, category })
    .from(product)
    .leftJoin(category, eq(product.categoryId, category.id))
    .where(and(...conditions))
    .orderBy(sortExpression)
    .$dynamic();
  const rows: ProductWithCategory[] = priceSensitive || filters.all
    ? await query
    : await query.limit(limit).offset(skip);
  const total = priceSensitive
    ? 0
    : await db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(product)
        .leftJoin(category, eq(product.categoryId, category.id))
        .where(and(...conditions))
        .then(([row]) => row?.count ?? 0);

  const details = await loadProductDetails(rows.map((row) => row.product.id));
  const colorGroupStats = await loadColorGroupStats(rows.map(({ product: current }) => ({ id: current.id, colorGroupId: current.colorGroupId })));
  const rules = await getActiveAutomaticDiscountsWithDrizzle();
  const automaticPrices = applyAutomaticDiscounts(
    rows.map((row) => row.product),
    rules,
  );
  let pricedProducts = rows.map((row) => ({
    ...row,
    effectivePrice:
      automaticPrices.get(row.product.id)?.unitPrice ??
      Number(row.product.salePrice ?? row.product.price),
  }));

  if (priceSensitive) {
    pricedProducts = pricedProducts.filter(({ product: current, effectivePrice }) => {
      const onSale = effectivePrice < Number(current.price);
      return (
        (!filters.onSale || onSale) &&
        (filters.minPrice == null || effectivePrice >= filters.minPrice) &&
        (filters.maxPrice == null || effectivePrice <= filters.maxPrice)
      );
    });
    if (filters.sort === "price-low") {
      pricedProducts.sort((a, b) => a.effectivePrice - b.effectivePrice);
    } else if (filters.sort === "price-high") {
      pricedProducts.sort((a, b) => b.effectivePrice - a.effectivePrice);
    }
  }

  const matchingTotal = priceSensitive ? pricedProducts.length : total;
  const pageProducts = priceSensitive
    ? pricedProducts.slice(skip, skip + limit)
    : pricedProducts;

  return {
    products: pageProducts.map(({ product: current, category: currentCategory, effectivePrice }) => {
      const ratings = details.ratings.get(current.id);
      return {
        id: current.id,
        name: current.name,
        slug: current.slug,
        colorName: current.colorName,
        price: Number(current.price),
        salePrice: effectivePrice < Number(current.price) ? effectivePrice : null,
        imageUrl: details.images.get(current.id)?.find((image) => image.isPrimary)?.url ?? null,
        isNewArrival: current.isNewArrival,
        stockQuantity: colorGroupStats.get(current.id)?.stock ?? current.stockQuantity,
        colorCount: colorGroupStats.get(current.id)?.count ?? 0,
        averageRating: averageRating(ratings),
        categorySlug: currentCategory?.slug,
      };
    }),
    total: matchingTotal,
    page,
    totalPages: Math.ceil(matchingTotal / limit),
  };
}

export async function getProductBySlugWithDrizzle(slug: string) {
  const { db } = getDrizzleClient();
  const [row] = await db
    .select({ product, category })
    .from(product)
    .leftJoin(category, eq(product.categoryId, category.id))
    .where(eq(product.slug, slug))
    .limit(1);
  if (!row) return null;

  const [images, reviews] = await Promise.all([
    db
      .select()
      .from(productImage)
      .where(eq(productImage.productId, row.product.id))
      .orderBy(asc(productImage.sortOrder)),
    db
      .select()
      .from(review)
      .where(
        and(
          eq(review.productId, row.product.id),
          eq(review.status, "APPROVED"),
        ),
      )
      .orderBy(desc(review.createdAt))
      .limit(20),
  ]);

  return {
    ...row.product,
    category: row.category,
    images,
    reviews,
  };
}

export async function getBestSellersWithDrizzle(limit = 8) {
  const { db } = getDrizzleClient();
  const top = await db
    .select({
      productId: orderItem.productId,
      quantity: sql<number>`sum(${orderItem.quantity})`.mapWith(Number),
    })
    .from(orderItem)
    .where(isNotNull(orderItem.productId))
    .groupBy(orderItem.productId)
    .orderBy(desc(sql`sum(${orderItem.quantity})`))
    .limit(limit);
  const ids = top.map((row) => row.productId).filter((id): id is string => !!id);
  if (ids.length === 0) return getProductsWithDrizzle({ limit, sort: "featured" });

  const purchasedProducts = await db.select({ id: product.id, colorGroupId: product.colorGroupId })
    .from(product).where(inArray(product.id, ids));
  const displayIds = [...new Set(purchasedProducts.map((item) => item.colorGroupId || item.id))];
  const products = await db
    .select({ product, category })
    .from(product)
    .leftJoin(category, eq(product.categoryId, category.id))
    .where(and(inArray(product.id, displayIds), eq(product.isActive, true), isNull(product.archivedAt)));
  const byId = new Map(products.map((row) => [row.product.id, row]));
  const ordered = displayIds.map((id) => byId.get(id)).filter((row): row is ProductWithCategory => !!row);
  const details = await loadProductDetails(ordered.map((row) => row.product.id));
  const colorGroupStats = await loadColorGroupStats(ordered.map(({ product: current }) => ({ id: current.id, colorGroupId: current.colorGroupId })));
  const rules = await getActiveAutomaticDiscountsWithDrizzle();
  const automaticPrices = applyAutomaticDiscounts(ordered.map((row) => row.product), rules);

  return {
    products: ordered.map(({ product: current }) => {
      const effectivePrice =
        automaticPrices.get(current.id)?.unitPrice ??
        Number(current.salePrice ?? current.price);
      return {
        id: current.id,
        name: current.name,
        slug: current.slug,
        colorName: current.colorName,
        price: Number(current.price),
        salePrice: effectivePrice < Number(current.price) ? effectivePrice : null,
        imageUrl: details.images.get(current.id)?.find((image) => image.isPrimary)?.url ?? null,
        isNewArrival: current.isNewArrival,
        stockQuantity: colorGroupStats.get(current.id)?.stock ?? current.stockQuantity,
        colorCount: colorGroupStats.get(current.id)?.count ?? 0,
        averageRating: averageRating(details.ratings.get(current.id)),
      };
    }),
    total: ids.length,
    page: 1,
    totalPages: 1,
  };
}
