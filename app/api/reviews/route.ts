import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth, isAdminRole } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

const createSchema = z.object({
  productId: z.string(),
  authorName: z.string().min(2).max(100),
  authorEmail: z.string().email().optional().nullable(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional().nullable(),
  body: z.string().max(2000).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }
    const review = await prisma.review.create({
      data: {
        ...parsed.data,
        userId: session?.user?.id || null,
        status: "PENDING",
      },
    });
    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { id, status, isFeatured } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const review = await prisma.review.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(isFeatured != null && { isFeatured }),
    },
  });
  return NextResponse.json({ success: true, review });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const productId = sp.get("productId");

  // Public: only approved for a product
  if (productId && !isAdminRole(session?.user?.role)) {
    const reviews = await prisma.review.findMany({
      where: { productId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ reviews });
  }

  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reviews = await prisma.review.findMany({
    where: status ? { status: status as never } : {},
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true, slug: true } } },
    take: 50,
  });
  return NextResponse.json({ reviews });
}
