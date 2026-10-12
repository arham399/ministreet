import { NextRequest, NextResponse } from "next/server";
import { auth, isAdminRole } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { TRACKING_STATUS_COPY } from "@/lib/constants";
import type { OrderStatus } from "@prisma/client";
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

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const allowed = ORDER_STATUS_TRANSITIONS[order.status];
  if (!allowed.includes(newStatus) && order.status !== newStatus) {
    return NextResponse.json(
      { error: `Cannot transition from ${order.status} to ${newStatus}` },
      { status: 400 }
    );
  }

  const statusChanged = newStatus !== order.status;
  const copy = TRACKING_STATUS_COPY[newStatus];

  const updated = await prisma.$transaction(async (tx) => {
    const o = await tx.order.update({
      where: { id },
      data: {
        status: newStatus,
        ...(courierName !== undefined && { courierName }),
        ...(courierTracking !== undefined && { courierTracking }),
      },
    });

    if (statusChanged) {
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: newStatus,
          note: note || `Status changed to ${newStatus}`,
          actorId: session.user.id,
        },
      });

      await tx.trackingEvent.create({
        data: {
          orderId: id,
          status: newStatus,
          title: copy?.title || newStatus,
          description: description || copy?.description || null,
          eventAt: new Date(),
          actorId: session.user.id,
        },
      });
    }

    // Restore stock on cancel
    if (newStatus === "CANCELLED" && order.status !== "CANCELLED") {
      const items = await tx.orderItem.findMany({ where: { orderId: id } });
      for (const item of items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } },
          });
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              type: "RETURN",
              reason: `Order ${order.orderNumber} cancelled`,
              orderId: id,
              actorId: session.user.id,
            },
          });
        }
      }
    }

    if (statusChanged) {
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "ORDER_STATUS_CHANGED",
          entityType: "Order",
          entityId: id,
          metadata: { from: order.status, to: newStatus },
        },
      });
    } else if (courierName !== undefined || courierTracking !== undefined) {
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "ORDER_SHIPPING_DETAILS_UPDATED",
          entityType: "Order",
          entityId: id,
        },
      });
    }

    return o;
  });

  let deliveryEmailSent = false;
  let deliveryEmailError: string | undefined;
  if (statusChanged && newStatus === "OUT_FOR_DELIVERY") {
    try {
      const { orderOutForDeliveryEmailHtml, sendEmail } = await import("@/lib/email/client");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const emailResult = await sendEmail({
        to: order.customerEmail,
        subject: `Your Mini Street parcel is out for delivery — ${order.orderNumber}`,
        html: orderOutForDeliveryEmailHtml({
          customerName: order.customerName,
          orderNumber: order.orderNumber,
          trackingId: order.trackingId,
          courierName: updated.courierName,
          courierTracking: updated.courierTracking,
          trackUrl: `${appUrl}/track-order/${encodeURIComponent(order.trackingId)}`,
        }),
        template: "order-out-for-delivery",
        orderId: order.id,
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
