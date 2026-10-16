import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth, isAdminRole } from "@/lib/auth/config";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { auditLog, offer } from "@/lib/db/drizzle/schema";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || typeof (body as { isActive?: unknown }).isActive !== "boolean") {
    return NextResponse.json({ error: "Choose whether to activate or pause this offer." }, { status: 400 });
  }

  try {
    const { id } = await context.params;
    const { db } = getDrizzleClient();
    const savedOffer = await db.transaction(async (tx) => {
      const [updated] = await tx.update(offer)
        .set({ isActive: (body as { isActive: boolean }).isActive, updatedAt: new Date() })
        .where(eq(offer.id, id))
        .returning();
      if (!updated) return null;
      await tx.insert(auditLog).values({
        id: globalThis.crypto.randomUUID(),
        actorId: session.user.id,
        action: updated.isActive ? "OFFER_ACTIVATED" : "OFFER_DEACTIVATED",
        entityType: "Offer",
        entityId: updated.id,
        metadata: { title: updated.title },
      });
      return updated;
    });
    if (!savedOffer) return NextResponse.json({ error: "Offer not found." }, { status: 404 });
    return NextResponse.json({ success: true, offer: savedOffer });
  } catch (error) {
    console.error("[PATCH /api/offers/:id] Failed to update offer.", error);
    return NextResponse.json({ error: "Unable to update offer. Please try again." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const { db } = getDrizzleClient();
    const deleted = await db.transaction(async (tx) => {
      const [existing] = await tx.select().from(offer).where(eq(offer.id, id)).limit(1);
      if (!existing) return false;
      await tx.insert(auditLog).values({
        id: globalThis.crypto.randomUUID(),
        actorId: session.user.id,
        action: "OFFER_DELETED",
        entityType: "Offer",
        entityId: existing.id,
        metadata: { title: existing.title },
      });
      await tx.delete(offer).where(eq(offer.id, id));
      return true;
    });
    if (!deleted) return NextResponse.json({ error: "Offer not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/offers/:id] Failed to delete offer.", error);
    return NextResponse.json({ error: "Unable to delete offer. Please try again." }, { status: 500 });
  }
}
