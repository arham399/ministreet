import { NextRequest, NextResponse } from "next/server";
import { auth, isAdminRole } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { productSchema } from "@/lib/validation/product";
import { getProducts } from "@/lib/db/queries/products";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const result = await getProducts({
      category: sp.get("category") || undefined,
      q: sp.get("q") || undefined,
      sort: sp.get("sort") || undefined,
      page: Number(sp.get("page") || 1),
      limit: Number(sp.get("limit") || 24),
      inStock: sp.get("inStock") === "true",
      onSale: sp.get("onSale") === "true",
      newArrival: sp.get("newArrival") === "true",
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = productSchema.safeParse({
      ...body,
      slug: body.slug || slugify(body.name || ""),
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid data" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        sku: data.sku,
        description: data.description,
        price: data.price,
        salePrice: data.salePrice,
        costPrice: data.costPrice,
        stockQuantity: data.stockQuantity,
        lowStockThreshold: data.lowStockThreshold,
        trackInventory: data.trackInventory,
        allowBackorder: data.allowBackorder,
        isActive: data.isActive,
        isNewArrival: data.isNewArrival,
        isFeatured: data.isFeatured,
        badge: data.badge,
        categoryId: data.categoryId || null,
        tags: {
          create: data.tags.map((name) => ({ name: name.toLowerCase() })),
        },
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        images: data.imageUrls.length
          ? {
              create: data.imageUrls.map((url, i) => ({
                url,
                isPrimary: i === 0,
                sortOrder: i,
              })),
            }
          : undefined,
      },
      include: { images: true, tags: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "PRODUCT_CREATED",
        entityType: "Product",
        entityId: product.id,
        metadata: { name: product.name, sku: product.sku },
      },
    });

    return NextResponse.json({
      success: true,
      product: { ...product, tags: product.tags.map((tag) => tag.name) },
    }, { status: 201 });
  } catch (err: unknown) {
    console.error(err);
    const msg = err instanceof Error ? err.message : "Failed to create product";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "SKU or slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
