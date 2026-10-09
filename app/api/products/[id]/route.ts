import { NextRequest, NextResponse } from "next/server";
import { auth, isAdminRole } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { productSchema } from "@/lib/validation/product";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: true, category: true, tags: true },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...product, tags: product.tags.map((tag) => tag.name) });
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
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(data.name != null && { name: data.name }),
      ...(data.slug != null && { slug: data.slug }),
      ...(data.sku != null && { sku: data.sku }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price != null && { price: data.price }),
      ...(data.salePrice !== undefined && { salePrice: data.salePrice }),
      ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
      ...(data.stockQuantity != null && { stockQuantity: data.stockQuantity }),
      ...(data.lowStockThreshold != null && { lowStockThreshold: data.lowStockThreshold }),
      ...(data.trackInventory != null && { trackInventory: data.trackInventory }),
      ...(data.isActive != null && { isActive: data.isActive }),
      ...(data.isNewArrival != null && { isNewArrival: data.isNewArrival }),
      ...(data.isFeatured != null && { isFeatured: data.isFeatured }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.tags != null && {
        tags: {
          deleteMany: {},
          create: data.tags.map((name) => ({ name: name.toLowerCase() })),
        },
      }),
      ...(data.seoTitle !== undefined && { seoTitle: data.seoTitle }),
      ...(data.seoDescription !== undefined && { seoDescription: data.seoDescription }),
    },
    include: { tags: true },
  });

  if (data.imageUrls?.length) {
    await prisma.productImage.deleteMany({ where: { productId: id } });
    await prisma.productImage.createMany({
      data: data.imageUrls.map((url, i) => ({
        productId: id,
        url,
        isPrimary: i === 0,
        sortOrder: i,
      })),
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "PRODUCT_UPDATED",
      entityType: "Product",
      entityId: id,
    },
  });

  return NextResponse.json({
    success: true,
    product: { ...product, tags: product.tags.map((tag) => tag.name) },
  });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  // Soft delete
  await prisma.product.update({
    where: { id },
    data: { archivedAt: new Date(), isActive: false },
  });
  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "PRODUCT_ARCHIVED",
      entityType: "Product",
      entityId: id,
    },
  });
  return NextResponse.json({ success: true });
}
