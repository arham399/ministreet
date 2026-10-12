import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import {
  applyAutomaticDiscounts,
} from "@/lib/discounts/apply-automatic-discounts";
import { getActiveAutomaticDiscounts } from "@/lib/discounts/queries";

export type ProductListFilters = {
  category?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
  newArrival?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
};

export async function getProductPriceCeiling(category?: string) {
  const result = await prisma.product.aggregate({
    where: {
      isActive: true,
      archivedAt: null,
      ...(category ? { category: { slug: category } } : {}),
    },
    _max: { price: true },
  });
  return Math.max(1, Math.ceil(Number(result._max.price ?? 0)));
}

export async function getProducts(filters: ProductListFilters = {}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 24;
  const skip = (page - 1) * limit;
  const priceSensitive =
    filters.minPrice != null ||
    filters.maxPrice != null ||
    filters.onSale === true ||
    filters.sort === "price-low" ||
    filters.sort === "price-high";

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    archivedAt: null,
  };

  if (filters.category) {
    where.category = { slug: filters.category };
  }
  const conditions: Prisma.ProductWhereInput[] = [];
  if (filters.q) {
    conditions.push({
      OR: [
        { name: { contains: filters.q } },
        { description: { contains: filters.q } },
        { tags: { some: { name: filters.q.toLowerCase() } } },
      ],
    });
  }
  if (filters.inStock) {
    where.stockQuantity = { gt: 0 };
  }
  if (filters.newArrival) {
    where.isNewArrival = true;
  }
  if (conditions.length > 0) {
    where.AND = conditions;
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  switch (filters.sort) {
    case "price-low":
      orderBy = { price: "asc" };
      break;
    case "price-high":
      orderBy = { price: "desc" };
      break;
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "name":
      orderBy = { name: "asc" };
      break;
    default:
      orderBy = { isFeatured: "desc" };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      ...(priceSensitive ? {} : { skip, take: limit }),
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: true,
        reviews: { where: { status: "APPROVED" }, select: { rating: true } },
      },
    }),
    priceSensitive ? Promise.resolve(0) : prisma.product.count({ where }),
  ]);
  const discountRules = await getActiveAutomaticDiscounts();
  const automaticPrices = applyAutomaticDiscounts(products, discountRules);
  let pricedProducts = products.map((product) => {
    const price = automaticPrices.get(product.id)?.unitPrice ?? Number(product.salePrice ?? product.price);
    return { product, effectivePrice: price };
  });
  if (priceSensitive) {
    pricedProducts = pricedProducts.filter(({ product, effectivePrice }) => {
      const onSale = effectivePrice < Number(product.price);
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
    products: pageProducts.map(({ product: p, effectivePrice }) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      salePrice: effectivePrice < Number(p.price) ? effectivePrice : null,
      imageUrl: p.images[0]?.url ?? null,
      isNewArrival: p.isNewArrival,
      stockQuantity: p.stockQuantity,
      averageRating:
        p.reviews.length > 0
          ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length
          : null,
      categorySlug: p.category?.slug,
    })),
    total: matchingTotal,
    page,
    totalPages: Math.ceil(matchingTotal / limit),
  };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
}

export async function getNewArrivals(limit = 8) {
  return getProducts({ newArrival: true, limit, sort: "newest" });
}

export async function getBestSellers(limit = 8) {
  // Calculate from order items
  const top = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
    where: { productId: { not: null } },
  });

  const ids = top.map((t) => t.productId!).filter(Boolean);
  if (ids.length === 0) {
    return getProducts({ limit, sort: "featured" });
  }

  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true, archivedAt: null },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      reviews: { where: { status: "APPROVED" }, select: { rating: true } },
    },
  });
  const discountRules = await getActiveAutomaticDiscounts();
  const automaticPrices = applyAutomaticDiscounts(products, discountRules);

  // Preserve order
  const map = new Map(products.map((p) => [p.id, p]));
  return {
    products: ids
      .map((id) => map.get(id))
      .filter(Boolean)
      .map((p) => ({
        id: p!.id,
        name: p!.name,
        slug: p!.slug,
        price: Number(p!.price),
        salePrice:
          (automaticPrices.get(p!.id)?.unitPrice ?? Number(p!.salePrice ?? p!.price)) < Number(p!.price)
            ? automaticPrices.get(p!.id)!.unitPrice
            : null,
        imageUrl: p!.images[0]?.url ?? null,
        isNewArrival: p!.isNewArrival,
        stockQuantity: p!.stockQuantity,
        averageRating:
          p!.reviews.length > 0
            ? p!.reviews.reduce((s, r) => s + r.rating, 0) / p!.reviews.length
            : null,
      })),
    total: ids.length,
    page: 1,
    totalPages: 1,
  };
}
