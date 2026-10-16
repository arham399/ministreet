import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, gt, isNull, lte, or } from "drizzle-orm";
import { auth, isAdminRole } from "@/lib/auth/config";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { auditLog, offer } from "@/lib/db/drizzle/schema";
import { offerSchema } from "@/lib/validation/coupon";

export async function GET() {
  try {
    const { db } = getDrizzleClient();
    const now = new Date();
    const offers = await db.select().from(offer).where(and(
      eq(offer.isActive, true),
      or(isNull(offer.startsAt), lte(offer.startsAt, now)),
      or(isNull(offer.endsAt), gt(offer.endsAt, now)),
    )).orderBy(asc(offer.displayOrder), asc(offer.createdAt));
    return NextResponse.json({ offers });
  } catch (error) {
    console.error("[GET /api/offers] Failed to load current offers.", error);
    return NextResponse.json({ error: "Unable to load offers." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const parsed = offerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }
  const d = parsed.data;
  const { db } = getDrizzleClient();
  try {
    const createdOffer = await db.transaction(async (tx) => {
      const [saved] = await tx.insert(offer).values({
        id: globalThis.crypto.randomUUID(),
        updatedAt: new Date(),
        title: d.title,
        description: d.description || null,
        imageUrl: d.imageUrl || null,
        linkUrl: d.linkUrl || null,
        startsAt: d.startsAt ? new Date(d.startsAt) : null,
        endsAt: d.endsAt ? new Date(d.endsAt) : null,
        isActive: d.isActive,
        displayOrder: d.displayOrder,
      }).returning();
      if (saved) {
        await tx.insert(auditLog).values({
          id: globalThis.crypto.randomUUID(),
          actorId: session.user.id,
          action: "OFFER_CREATED",
          entityType: "Offer",
          entityId: saved.id,
          metadata: { title: saved.title },
        });
      }
      return saved;
    });
    if (!createdOffer) throw new Error("Offer insert returned no record.");
    return NextResponse.json({ success: true, offer: createdOffer }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/offers] Failed to create offer.", error);
    return NextResponse.json({ error: "Unable to create offer. Please try again." }, { status: 500 });
  }
}
