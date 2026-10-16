import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth, isAdminRole } from "@/lib/auth/config";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { auditLog, discount } from "@/lib/db/drizzle/schema";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const session = await auth();
    if (!session?.user || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await ctx.params;
    const { db } = getDrizzleClient();
    const result = await db.transaction(async (tx) => {
      const [existing] = await tx.select().from(discount).where(eq(discount.id, id)).limit(1);
      if (!existing) return null;
      await tx.insert(auditLog).values({
        id: globalThis.crypto.randomUUID(),
        actorId: session.user.id,
        action: "DISCOUNT_DELETED",
        entityType: "Discount",
        entityId: existing.id,
        metadata: { name: existing.name, usageCount: existing.usageCount },
      });
      await tx.delete(discount).where(eq(discount.id, id));
      return existing;
    });
    if (!result) return NextResponse.json({ error: "Discount not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/discounts/:id] Failed to delete discount.", error);
    return NextResponse.json({ error: "Unable to delete discount." }, { status: 500 });
  }
}
