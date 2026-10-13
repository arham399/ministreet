import { NextRequest, NextResponse } from "next/server";
import { auth, isAdminRole } from "@/lib/auth/config";
import { TRACKING_STATUS_COPY } from "@/lib/constants";
import { eq, sql } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import {
  auditLog,
  inventoryMovement,
  order,
  orderItem,
  orderStatusHistory,
  product,
  trackingEvent,
} from "@/lib/db/drizzle/schema";
import type { OrderStatus } from "@/lib/orders/status-transitions";
import { ORDER_STATUS_TRANSITIONS } from "@/lib/orders/status-transitions";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const newStatus = body.status as OrderStatus;
  const note = body.note as string | undefined;
  const description = body.description as string | undefined;
  const courierName = body.courierName as string | undefined;
  const courierTracking = body.courierTracking as string | undefined;

  const { db } = getDrizzleClient();
  const [currentOrder] = await db.select().from(order).where(eq(order.id, id)).limit(1);
  if (!currentOrder) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const allowed = ORDER_STATUS_TRANSITIONS[currentOrder.status];
  if (!allowed.includes(newStatus) && currentOrder.status !== newStatus) {
    return NextResponse.json(
      { error: `Cannot transition from ${currentOrder.status} to ${newStatus}` },
      { status: 400 }
    );
  }
  if (
    currentOrder.paymentMethod === "BANK_TRANSFER" &&
    currentOrder.paymentStatus !== "PAID" &&
    newStatus !== currentOrder.status &&
    newStatus !== "CANCELLED"
  ) {
    return NextResponse.json(
      { error: "Verify the payment before confirming or fulfilling this order." },
      { status: 409 },
    );
  }

  const statusChanged = newStatus !== currentOrder.status;
  const copy = TRACKING_STATUS_COPY[newStatus];

  const updated = await db.transaction(async (tx) => {
    const [updatedOrder] = await tx
      .update(order)
      .set({
        status: newStatus,
        updatedAt: new Date(),
        ...(courierName !== undefined && { courierName }),
        ...(courierTracking !== undefined && { courierTracking }),
      })
      .where(eq(order.id, id))
      .returning();
    if (!updatedOrder) throw new Error("Order not found");

    if (statusChanged) {
      await tx.insert(orderStatusHistory).values({
        orderId: id,
        status: newStatus,
        note: note || `Status changed to ${newStatus}`,
        actorId: session.user.id ?? null,
      });

      await tx.insert(trackingEvent).values({
        orderId: id,
        status: newStatus,
        title: copy?.title || newStatus,
        description: description || copy?.description || null,
        eventAt: new Date(),
        actorId: session.user.id ?? null,
      });
    }

    // Restore stock on cancel
    if (newStatus === "CANCELLED" && currentOrder.status !== "CANCELLED") {
      const items = await tx.select().from(orderItem).where(eq(orderItem.orderId, id));
      for (const item of items) {
        if (item.productId) {
          await tx
            .update(product)
            .set({
              stockQuantity: sql`${product.stockQuantity} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(product.id, item.productId));
          await tx.insert(inventoryMovement).values({
            productId: item.productId,
            quantity: item.quantity,
            type: "RETURN",
            reason: `Order ${currentOrder.orderNumber} cancelled`,
            orderId: id,
            actorId: session.user.id ?? null,
          });
        }
      }
    }

    if (statusChanged) {
      await tx.insert(auditLog).values({
        actorId: session.user.id ?? null,
        action: "ORDER_STATUS_CHANGED",
        entityType: "Order",
        entityId: id,
        metadata: { from: currentOrder.status, to: newStatus },
      });
    } else if (courierName !== undefined || courierTracking !== undefined) {
      await tx.insert(auditLog).values({
        actorId: session.user.id ?? null,
        action: "ORDER_SHIPPING_DETAILS_UPDATED",
        entityType: "Order",
        entityId: id,
      });
    }

    return updatedOrder;
  });

  let deliveryEmailSent = false;
  let deliveryEmailError: string | undefined;
  if (statusChanged && newStatus === "OUT_FOR_DELIVERY") {
    try {
      const { orderOutForDeliveryEmailHtml, sendEmail } = await import("@/lib/email/client");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const emailResult = await sendEmail({
        to: currentOrder.customerEmail,
        subject: `Your Mini Street parcel is out for delivery — ${currentOrder.orderNumber}`,
        html: orderOutForDeliveryEmailHtml({
          customerName: currentOrder.customerName,
          orderNumber: currentOrder.orderNumber,
          trackingId: currentOrder.trackingId,
          courierName: updated.courierName,
          courierTracking: updated.courierTracking,
          trackUrl: `${appUrl}/track-order/${encodeURIComponent(currentOrder.trackingId)}`,
        }),
        template: "order-out-for-delivery",
        orderId: currentOrder.id,
      });
      deliveryEmailSent = emailResult.success;
      if (!emailResult.success) deliveryEmailError = emailResult.error;
    } catch (error) {
      console.error("[PATCH /api/orders/:id/status] delivery email failed", error);
      deliveryEmailError = "Could not send the delivery update email.";
    }
  }

  return NextResponse.json({
    success: true,
    order: updated,
    ...(statusChanged && newStatus === "OUT_FOR_DELIVERY"
      ? { deliveryEmailSent, ...(deliveryEmailError ? { deliveryEmailError } : {}) }
      : {}),
  });
}
