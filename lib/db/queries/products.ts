import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

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

export async function getProducts(filters: ProductListFilters = {}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 24;
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    archivedAt: null,
  };

  if (filters.category) {
    where.category = { slug: filters.category };
  }
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q } },
      { description: { contains: filters.q } },
      { tags: { some: { name: filters.q.toLowerCase() } } },
    ];
  }
  if (filters.inStock) {
    where.stockQuantity = { gt: 0 };
  }
  if (filters.onSale) {
    where.salePrice = { not: null };
  }
  if (filters.newArrival) {
    where.isNewArrival = true;
  }
  if (filters.minPrice != null || filters.maxPrice != null) {
    where.OR = [
      ...(Array.isArray(where.OR) ? where.OR : []),
      {
        price: {
          ...(filters.minPrice != null ? { gte: filters.minPrice } : {}),
          ...(filters.maxPrice != null ? { lte: filters.maxPrice } : {}),
        },
      },
    ];
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
      skip,
      take: limit,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: true,
        reviews: { where: { status: "APPROVED" }, select: { rating: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      salePrice: p.salePrice != null ? Number(p.salePrice) : null,
      imageUrl: p.images[0]?.url ?? null,
      isNewArrival: p.isNewArrival,
      stockQuantity: p.stockQuantity,
      averageRating:
        p.reviews.length > 0
          ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length
          : null,
      categorySlug: p.category?.slug,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
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
        salePrice: p!.salePrice != null ? Number(p!.salePrice) : null,
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
