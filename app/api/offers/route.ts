import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { auth, isAdminRole } from "@/lib/auth/config";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { offer } from "@/lib/db/drizzle/schema";
import { offerSchema } from "@/lib/validation/coupon";

export async function GET() {
  const { db } = getDrizzleClient();
  const offers = await db.select().from(offer)
    .where(eq(offer.isActive, true)).orderBy(asc(offer.displayOrder));
  return NextResponse.json({ offers });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const parsed = offerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }
  const d = parsed.data;
  const { db } = getDrizzleClient();
  const [createdOffer] = await db.insert(offer).values({
      id: globalThis.crypto.randomUUID(),
      updatedAt: new Date(),
      title: d.title,
      description: d.description,
      imageUrl: d.imageUrl,
      linkUrl: d.linkUrl,
      startsAt: d.startsAt ? new Date(d.startsAt) : null,
      endsAt: d.endsAt ? new Date(d.endsAt) : null,
      isActive: d.isActive,
      displayOrder: d.displayOrder,
    }).returning();
  return NextResponse.json({ success: true, offer: createdOffer }, { status: 201 });
}
