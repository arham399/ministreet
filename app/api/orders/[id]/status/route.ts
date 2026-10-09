import { NextRequest, NextResponse } from "next/server";
import { auth, isAdminRole } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { TRACKING_STATUS_COPY } from "@/lib/constants";
import type { OrderStatus } from "@prisma/client";

const ALLOWED: Record<string, OrderStatus[]> = {
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: ["REFUNDED"],
  REFUNDED: [],
};

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

  const allowed = ALLOWED[order.status] || [];
  if (!allowed.includes(newStatus) && order.status !== newStatus) {
    return NextResponse.json(
      { error: `Cannot transition from ${order.status} to ${newStatus}` },
      { status: 400 }
    );
  }

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

    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "ORDER_STATUS_CHANGED",
        entityType: "Order",
        entityId: id,
        metadata: { from: order.status, to: newStatus },
      },
    });

    return o;
  });

  return NextResponse.json({ success: true, order: updated });
}
