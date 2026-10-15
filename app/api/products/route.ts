import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { auditLog, product, productImage, productTag } from "@/lib/db/drizzle/schema";
import { auth, isAdminRole } from "@/lib/auth/config";
import { productSchema } from "@/lib/validation/product";
import { getProducts } from "@/lib/db/queries/products";
import { slugify } from "@/lib/utils";

async function getAvailableProductSlug(tx: Parameters<Parameters<ReturnType<typeof getDrizzleClient>["db"]["transaction"]>[0]>[0], baseSlug: string, sku: string) {
  // Product URLs must stay unique. Color variants share a display name, so give
  // any later listing a stable SKU suffix when the base slug is already taken.
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`product-slug:${baseSlug}`}))`);

  const skuSuffix = slugify(sku) || "variant";
  let candidate = baseSlug;
  let suffixNumber = 1;

  while (true) {
    const [existing] = await tx.select({ id: product.id }).from(product).where(eq(product.slug, candidate)).limit(1);
    if (!existing) return candidate;

    candidate = suffixNumber === 1
      ? `${baseSlug}-${skuSuffix}`
      : `${baseSlug}-${skuSuffix}-${suffixNumber}`;
    suffixNumber += 1;
  }
}

function findPostgresError(error: unknown): { code?: string; constraint?: string } {
  if (!error || typeof error !== "object") return {};
  const current = error as { code?: unknown; constraint?: unknown; cause?: unknown };
  const cause = current.cause && current.cause !== error ? findPostgresError(current.cause) : {};
  return {
    code: typeof current.code === "string" ? current.code : cause.code,
    constraint: typeof current.constraint === "string" ? current.constraint : cause.constraint,
  };
}

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
    const { db } = getDrizzleClient();
    const createdProduct = await db.transaction(async (tx) => {
      const uniqueSlug = await getAvailableProductSlug(tx, data.slug, data.sku);
      const [savedProduct] = await tx.insert(product).values({
        id: globalThis.crypto.randomUUID(),
        updatedAt: new Date(),
        name: data.name,
        slug: uniqueSlug,
        sku: data.sku,
        description: data.description,
        price: String(data.price),
        salePrice: data.salePrice == null ? null : String(data.salePrice),
        costPrice: data.costPrice == null ? null : String(data.costPrice),
        stockQuantity: data.stockQuantity,
        lowStockThreshold: data.lowStockThreshold,
        trackInventory: data.trackInventory,
        allowBackorder: data.allowBackorder,
        isActive: data.isActive,
        isNewArrival: data.isNewArrival,
        isFeatured: data.isFeatured,
        badge: data.badge,
        categoryId: data.categoryId || null,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
      }).returning();
      if (!savedProduct) throw new Error("Failed to create product");
      if (data.tags.length) {
        await tx.insert(productTag).values(data.tags.map((name) => ({
          productId: savedProduct.id,
          name: name.toLowerCase(),
        })));
      }
      const images = data.imageUrls.length
        ? await tx.insert(productImage).values(data.imageUrls.map((url, i) => ({
          id: globalThis.crypto.randomUUID(),
          productId: savedProduct.id,
            url,
            isPrimary: i === 0,
            sortOrder: i,
          }))).returning()
        : [];
      const tags = data.tags.map((name) => ({ name: name.toLowerCase() }));
      await tx.insert(auditLog).values({
        id: globalThis.crypto.randomUUID(),
        actorId: session.user.id,
        action: "PRODUCT_CREATED",
        entityType: "Product",
        entityId: savedProduct.id,
        metadata: { name: savedProduct.name, sku: savedProduct.sku },
      });
      return { ...savedProduct, images, tags };
    });

    return NextResponse.json({
      success: true,
      product: { ...createdProduct, tags: createdProduct.tags.map((tag) => tag.name) },
    }, { status: 201 });
  } catch (err: unknown) {
    console.error(err);
    const postgresError = findPostgresError(err);
    if (postgresError.code === "23505") {
      const message = postgresError.constraint?.includes("sku")
        ? "This SKU is already assigned to another product. Enter a unique SKU for each color."
        : "A product with this information already exists. Check the SKU and try again.";
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: "We couldn't save the product right now. Please try again." }, { status: 500 });
  }
}
