import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { can } from "@/lib/auth/permissions";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { TRACKING_STATUS_COPY } from "@/lib/constants";
import {
  auditLog,
  inventoryMovement,
  order,
  orderItem,
  orderStatusHistory,
  product,
  trackingEvent,
} from "@/lib/db/drizzle/schema";
import { sql } from "drizzle-orm";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: Context) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "orders:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let action: unknown;
  try { action = (await req.json()).action; } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (action !== "verify" && action !== "reject") {
    return NextResponse.json({ error: "Choose whether to verify or reject this payment." }, { status: 400 });
  }

  const { db } = getDrizzleClient();
  const result = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(order).where(eq(order.id, id)).limit(1);
    if (!current) return { error: "Order not found.", status: 404 as const };
    if (current.paymentMethod !== "BANK_TRANSFER" || !current.paymentProofPath) {
      return { error: "This order has no bank transfer proof to review.", status: 409 as const };
    }
    if (current.paymentStatus !== "PENDING") {
      return { error: "This payment has already been reviewed.", status: 409 as const };
    }
    if (current.status === "CANCELLED") {
      return { error: "A cancelled order cannot have its payment reviewed.", status: 409 as const };
    }

    const paymentStatus = action === "verify" ? "PAID" as const : "FAILED" as const;
    const nextOrderStatus = action === "verify" ? "CONFIRMED" as const : "CANCELLED" as const;
    const [updated] = await tx.update(order)
      .set({ paymentStatus, status: nextOrderStatus, updatedAt: new Date() })
      .where(and(eq(order.id, id), eq(order.paymentStatus, "PENDING")))
      .returning();
    if (!updated) return { error: "Payment was updated by another admin. Refresh and try again.", status: 409 as const };

    const note = action === "verify"
      ? "Bank transfer verified by an administrator; order automatically confirmed."
      : "Order cancelled because the submitted payment proof was not accepted.";
    await tx.insert(orderStatusHistory).values({
      orderId: id,
      status: nextOrderStatus,
      note,
      actorId: session.user.id ?? null,
    });
    if (action === "verify") {
      const copy = TRACKING_STATUS_COPY.CONFIRMED;
      await tx.insert(trackingEvent).values({
        orderId: id,
        status: "CONFIRMED",
        title: copy.title,
        description: "Your payment has been verified and your order is confirmed. We’re getting started on your treasures.",
        eventAt: new Date(),
        actorId: session.user.id ?? null,
      });
      await tx.insert(auditLog).values({
        actorId: session.user.id ?? null,
        action: "ORDER_STATUS_CHANGED",
        entityType: "Order",
        entityId: id,
        metadata: { from: current.status, to: "CONFIRMED", reason: "PAYMENT_VERIFIED" },
      });
    }
    if (action === "reject") {
      const now = new Date();
      await tx.insert(trackingEvent).values({
        orderId: id,
        status: "CANCELLED",
        title: "Order cancelled",
        description: "We could not verify the submitted payment. Please contact Mini Street if you believe this is an error.",
        eventAt: now,
        actorId: session.user.id ?? null,
      });
      const items = await tx.select().from(orderItem).where(eq(orderItem.orderId, id));
      for (const item of items) {
        if (!item.productId) continue;
        await tx.update(product)
          .set({ stockQuantity: sql`${product.stockQuantity} + ${item.quantity}`, updatedAt: now })
          .where(eq(product.id, item.productId));
        await tx.insert(inventoryMovement).values({
          productId: item.productId,
          quantity: item.quantity,
          type: "RETURN",
          reason: `Order ${current.orderNumber} cancelled after payment proof rejection`,
          orderId: id,
          actorId: session.user.id ?? null,
        });
      }
      await tx.insert(auditLog).values({
        actorId: session.user.id ?? null,
        action: "ORDER_STATUS_CHANGED",
        entityType: "Order",
        entityId: id,
        metadata: { from: current.status, to: "CANCELLED", reason: "PAYMENT_PROOF_REJECTED" },
      });
    }
    await tx.insert(auditLog).values({
      actorId: session.user.id ?? null,
      action: action === "verify" ? "ORDER_PAYMENT_VERIFIED" : "ORDER_PAYMENT_REJECTED",
      entityType: "Order",
      entityId: id,
    });
    return { order: updated, currentOrder: current };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  let emailSent = false;
  let emailError: string | undefined;
  try {
    const { sendEmail, orderPaymentReviewEmailHtml } = await import("@/lib/email/client");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const emailResult = await sendEmail({
      to: result.currentOrder.customerEmail,
      subject: action === "verify"
        ? `Payment verified — Mini Street order ${result.currentOrder.orderNumber}`
        : `Order update — Mini Street order ${result.currentOrder.orderNumber}`,
      html: orderPaymentReviewEmailHtml({
        customerName: result.currentOrder.customerName,
        orderNumber: result.currentOrder.orderNumber,
        trackingId: result.currentOrder.trackingId,
        total: `Rs. ${Number(result.currentOrder.total).toLocaleString("en-PK")}`,
        outcome: action,
        trackUrl: `${appUrl}/track-order/${encodeURIComponent(result.currentOrder.trackingId)}`,
      }),
      template: action === "verify" ? "payment-verified" : "payment-rejected-cancelled",
      orderId: result.currentOrder.id,
    });
    emailSent = emailResult.success;
    if (!emailResult.success) emailError = emailResult.error;
  } catch (err) {
    console.error("[PATCH /api/orders/:id/payment] customer email failed", err);
    emailError = "Could not send the customer update email.";
  }
  return NextResponse.json({
    success: true,
    paymentStatus: result.order.paymentStatus,
    orderStatus: result.order.status,
    emailSent,
    ...(emailError ? { emailError } : {}),
  });
}
