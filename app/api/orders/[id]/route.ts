import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { can } from "@/lib/auth/permissions";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { auditLog, emailLog, inventoryMovement, invoice, order, orderStatusHistory, trackingEvent } from "@/lib/db/drizzle/schema";
import { deletePaymentProof } from "@/lib/storage/payment-proofs";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, context: Context) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "orders:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const { db } = getDrizzleClient();
  const proofPath = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(order).where(eq(order.id, id)).limit(1).for("update");
    if (!current) return { error: "Order not found.", status: 404 as const };
    if (current.status !== "CANCELLED" && current.status !== "DELIVERED") {
      return { error: "Only cancelled or delivered orders can be deleted.", status: 409 as const };
    }
    await tx.delete(invoice).where(eq(invoice.orderId, id));
    await tx.delete(orderStatusHistory).where(eq(orderStatusHistory.orderId, id));
    await tx.delete(trackingEvent).where(eq(trackingEvent.orderId, id));
    await tx.insert(auditLog).values({
      actorId: session.user.id ?? null,
      action: "ORDER_DELETED",
      entityType: "Order",
      entityId: id,
      metadata: { orderNumber: current.orderNumber, status: current.status },
    });
    await tx.delete(emailLog).where(eq(emailLog.orderId, id));
    await tx.delete(inventoryMovement).where(eq(inventoryMovement.orderId, id));
    await tx.delete(order).where(and(eq(order.id, id), inArray(order.status, ["CANCELLED", "DELIVERED"])));
    return { path: current.paymentProofPath };
  });

  if ("error" in proofPath) {
    return NextResponse.json({ error: proofPath.error }, { status: proofPath.status });
  }
  let storageCleanupPending = false;
  if (proofPath.path) {
    try { storageCleanupPending = !(await deletePaymentProof(proofPath.path)); }
    catch (error) {
      console.error("[DELETE /api/orders/:id] Supabase Storage cleanup failed.", error);
      storageCleanupPending = true;
    }
  }
  return NextResponse.json({ success: true, storageCleanupPending });
}
