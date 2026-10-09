import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ items: [], guest: true });
  }

  let wishlist = await prisma.wishlist.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              include: { images: { where: { isPrimary: true }, take: 1 } },
            },
          },
        },
      },
    });
  }

  const items = wishlist.items.map((i) => ({
    productId: i.productId,
    slug: i.product.slug,
    name: i.product.name,
    imageUrl: i.product.images[0]?.url ?? null,
    unitPrice: Number(i.product.price),
    salePrice: i.product.salePrice != null ? Number(i.product.salePrice) : null,
  }));

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

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  let wishlist = await prisma.wishlist.findUnique({
    where: { userId: session.user.id },
  });
  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: { userId: session.user.id },
    });
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: {
      wishlistId_productId: {
        wishlistId: wishlist.id,
        productId,
      },
    },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true, action: "removed" });
  }

  await prisma.wishlistItem.create({
    data: { wishlistId: wishlist.id, productId },
  });
  return NextResponse.json({ success: true, action: "added" });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { productId } = await req.json();
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: session.user.id },
  });
  if (!wishlist) return NextResponse.json({ success: true });

  await prisma.wishlistItem.deleteMany({
    where: { wishlistId: wishlist.id, productId },
  });
  return NextResponse.json({ success: true });
}
