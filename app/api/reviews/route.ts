import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { auth, isAdminRole } from "@/lib/auth/config";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { product, review } from "@/lib/db/drizzle/schema";

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
    const { db } = getDrizzleClient();
    const [createdReview] = await db.insert(review).values({
      id: globalThis.crypto.randomUUID(),
      updatedAt: new Date(),
      ...parsed.data,
      userId: session?.user?.id || null,
      status: "PENDING",
    }).returning();
    return NextResponse.json({ success: true, review: createdReview }, { status: 201 });
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
  const update: Partial<typeof review.$inferInsert> = {};
  update.updatedAt = new Date();
  if (status) update.status = status;
  if (isFeatured != null) update.isFeatured = isFeatured;
  const { db } = getDrizzleClient();
  const [updatedReview] = await db.update(review).set(update).where(eq(review.id, id)).returning();
  if (!updatedReview) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  return NextResponse.json({ success: true, review: updatedReview });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const productId = sp.get("productId");

  // Public: only approved for a product
  if (productId && !isAdminRole(session?.user?.role)) {
    const { db } = getDrizzleClient();
    const reviews = await db.select().from(review)
      .where(and(eq(review.productId, productId), eq(review.status, "APPROVED")))
      .orderBy(desc(review.createdAt));
    return NextResponse.json({ reviews });
  }

  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { db } = getDrizzleClient();
  const reviews = await db.select({
    id: review.id,
    productId: review.productId,
    userId: review.userId,
    authorName: review.authorName,
    authorEmail: review.authorEmail,
    rating: review.rating,
    title: review.title,
    body: review.body,
    status: review.status,
    isFeatured: review.isFeatured,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    product: { name: product.name, slug: product.slug },
  }).from(review).leftJoin(product, eq(review.productId, product.id))
    .where(status ? eq(review.status, status as "PENDING" | "APPROVED" | "REJECTED") : undefined)
    .orderBy(desc(review.createdAt)).limit(50);
  return NextResponse.json({ reviews });
}
