import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { and, eq } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { product, productImage, wishlist, wishlistItem } from "@/lib/db/drizzle/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ items: [], guest: true });
  }

  const { db } = getDrizzleClient();
  let [customerWishlist] = await db
    .select({ id: wishlist.id })
    .from(wishlist)
    .where(eq(wishlist.userId, session.user.id))
    .limit(1);

  if (!customerWishlist) {
    [customerWishlist] = await db
      .insert(wishlist)
      .values({
        id: globalThis.crypto.randomUUID(),
        userId: session.user.id,
        updatedAt: new Date(),
      })
      .returning({ id: wishlist.id });
  }

  const rows = await db
    .select({
      productId: wishlistItem.productId,
      slug: product.slug,
      name: product.name,
      imageUrl: productImage.url,
      price: product.price,
      salePrice: product.salePrice,
    })
    .from(wishlistItem)
    .innerJoin(product, eq(wishlistItem.productId, product.id))
    .leftJoin(productImage, and(
      eq(productImage.productId, product.id),
      eq(productImage.isPrimary, true),
    ))
    .where(eq(wishlistItem.wishlistId, customerWishlist.id));
  const seen = new Set<string>();
  const items = rows.flatMap((row) => {
    if (seen.has(row.productId)) return [];
    seen.add(row.productId);
    return [{
      productId: row.productId,
      slug: row.slug,
      name: row.name,
      imageUrl: row.imageUrl ?? null,
      unitPrice: Number(row.price),
      salePrice: row.salePrice != null ? Number(row.salePrice) : null,
    }];
  });

  return NextResponse.json({ items, guest: false });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to sync wishlist" }, { status: 401 });
  }

  const { productId } = await req.json();
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const { db } = getDrizzleClient();
  const [foundProduct] = await db
    .select({ id: product.id })
    .from(product)
    .where(eq(product.id, productId))
    .limit(1);
  if (!foundProduct) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  let [customerWishlist] = await db
    .select({ id: wishlist.id })
    .from(wishlist)
    .where(eq(wishlist.userId, session.user.id))
    .limit(1);
  if (!customerWishlist) {
    [customerWishlist] = await db
      .insert(wishlist)
      .values({
        id: globalThis.crypto.randomUUID(),
        userId: session.user.id,
        updatedAt: new Date(),
      })
      .returning({ id: wishlist.id });
  }

  const [existing] = await db
    .select({ id: wishlistItem.id })
    .from(wishlistItem)
    .where(and(
      eq(wishlistItem.wishlistId, customerWishlist.id),
      eq(wishlistItem.productId, productId),
    ))
    .limit(1);

  if (existing) {
    await db.delete(wishlistItem).where(eq(wishlistItem.id, existing.id));
    return NextResponse.json({ success: true, action: "removed" });
  }

  await db.insert(wishlistItem).values({
    id: globalThis.crypto.randomUUID(),
    wishlistId: customerWishlist.id,
    productId,
  });
  return NextResponse.json({ success: true, action: "added" });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { productId } = await req.json();
  const { db } = getDrizzleClient();
  const [customerWishlist] = await db
    .select({ id: wishlist.id })
    .from(wishlist)
    .where(eq(wishlist.userId, session.user.id))
    .limit(1);
  if (!customerWishlist) return NextResponse.json({ success: true });

  await db.delete(wishlistItem).where(and(
    eq(wishlistItem.wishlistId, customerWishlist.id),
    eq(wishlistItem.productId, productId),
  ));
  return NextResponse.json({ success: true });
}
