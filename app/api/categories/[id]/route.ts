import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { can } from "@/lib/auth/permissions";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { auditLog, category, product } from "@/lib/db/drizzle/schema";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, context: Context) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "products:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const { db } = getDrizzleClient();
  const result = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(category).where(eq(category.id, id)).limit(1);
    if (!current) return { error: "Category not found.", status: 404 as const };
    const assignedProducts = await tx.select({ id: product.id }).from(product).where(eq(product.categoryId, id));
    await tx.delete(category).where(eq(category.id, id));
    await tx.insert(auditLog).values({
      actorId: session.user.id ?? null,
      action: "CATEGORY_DELETED",
      entityType: "Category",
      entityId: id,
      metadata: { name: current.name, slug: current.slug, detachedProductCount: assignedProducts.length },
    });
    return { detachedProductCount: assignedProducts.length };
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ success: true, detachedProductCount: result.detachedProductCount });
}
