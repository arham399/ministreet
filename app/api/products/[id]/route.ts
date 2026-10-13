import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { auditLog, category, product, productImage, productTag } from "@/lib/db/drizzle/schema";
import { auth, isAdminRole } from "@/lib/auth/config";
import { productSchema } from "@/lib/validation/product";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const { db } = getDrizzleClient();
  const [productRows] = await Promise.all([
    db.select().from(product).where(eq(product.id, id)).limit(1),
  ]);
  const found = productRows[0];
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [images, tags, categories] = await Promise.all([
    db.select().from(productImage).where(eq(productImage.productId, id)).orderBy(asc(productImage.sortOrder)),
    db.select().from(productTag).where(eq(productTag.productId, id)),
    found.categoryId ? db.select().from(category).where(eq(category.id, found.categoryId)).limit(1) : [],
  ]);
  return NextResponse.json({ ...found, images, category: categories[0] ?? null, tags: tags.map((tag) => tag.name) });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = productSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }
  const data = parsed.data;
  const { db } = getDrizzleClient();
  const result = await db.transaction(async (tx) => {
    const update: Partial<typeof product.$inferInsert> = {};
    update.updatedAt = new Date();
    if (data.name != null) update.name = data.name;
    if (data.slug != null) update.slug = data.slug;
    if (data.sku != null) update.sku = data.sku;
    if (data.description !== undefined) update.description = data.description;
    if (data.price != null) update.price = String(data.price);
    if (data.salePrice !== undefined) update.salePrice = data.salePrice == null ? null : String(data.salePrice);
    if (data.costPrice !== undefined) update.costPrice = data.costPrice == null ? null : String(data.costPrice);
    if (data.stockQuantity != null) update.stockQuantity = data.stockQuantity;
    if (data.lowStockThreshold != null) update.lowStockThreshold = data.lowStockThreshold;
    if (data.trackInventory != null) update.trackInventory = data.trackInventory;
    if (data.allowBackorder != null) update.allowBackorder = data.allowBackorder;
    if (data.isActive != null) update.isActive = data.isActive;
    if (data.isNewArrival != null) update.isNewArrival = data.isNewArrival;
    if (data.isFeatured != null) update.isFeatured = data.isFeatured;
    if (data.badge !== undefined) update.badge = data.badge;
    if (data.categoryId !== undefined) update.categoryId = data.categoryId;
    if (data.seoTitle !== undefined) update.seoTitle = data.seoTitle;
    if (data.seoDescription !== undefined) update.seoDescription = data.seoDescription;

    const [savedProduct] = await tx.update(product).set(update).where(eq(product.id, id)).returning();
    if (!savedProduct) throw new Error("Product not found");
    if (data.tags != null) {
      await tx.delete(productTag).where(eq(productTag.productId, id));
      if (data.tags.length) {
        await tx.insert(productTag).values(data.tags.map((name) => ({ productId: id, name: name.toLowerCase() })));
      }
    }
    if (data.imageUrls?.length) {
      await tx.delete(productImage).where(eq(productImage.productId, id));
      await tx.insert(productImage).values(data.imageUrls.map((url, i) => ({
        productId: id,
        url,
        isPrimary: i === 0,
        sortOrder: i,
      })));
    }
    const tags = await tx.select().from(productTag).where(eq(productTag.productId, id));
    await tx.insert(auditLog).values({
      id: globalThis.crypto.randomUUID(),
      actorId: session.user.id,
      action: "PRODUCT_UPDATED",
      entityType: "Product",
      entityId: id,
    });
    return { ...savedProduct, tags };
  });

  return NextResponse.json({
    success: true,
    product: { ...result, tags: result.tags.map((tag) => tag.name) },
  });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  // Soft delete
  const { db } = getDrizzleClient();
  await db.transaction(async (tx) => {
    await tx.update(product).set({ archivedAt: new Date(), isActive: false, updatedAt: new Date() }).where(eq(product.id, id));
    await tx.insert(auditLog).values({
      id: globalThis.crypto.randomUUID(),
      actorId: session.user.id,
      action: "PRODUCT_ARCHIVED",
      entityType: "Product",
      entityId: id,
    });
  });
  return NextResponse.json({ success: true });
}
