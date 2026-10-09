/**
 * Transactional order creation — server only.
 * Never trusts client prices. Recalculates everything from DB.
 */
import { prisma } from "@/lib/db/prisma";
import { calculateOrderTotals, type CartLine } from "@/lib/pricing/calculate";
import { generateOrderNumber, generateInvoiceNumber } from "@/lib/utils";
import type { CheckoutInput } from "@/lib/validation/checkout";
import { TRACKING_STATUS_COPY } from "@/lib/constants";

export type CreateOrderResult =
  | { success: true; orderId: string; orderNumber: string; trackingId: string; total: number }
  | { success: false; error: string };

export async function createOrder(input: CheckoutInput): Promise<CreateOrderResult> {
  try {
    const productIds = input.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
        archivedAt: null,
      },
      include: { images: { where: { isPrimary: true }, take: 1 } },
    });

    if (products.length !== productIds.length) {
      return { success: false, error: "One or more products are unavailable." };
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate stock
    for (const item of input.items) {
      const product = productMap.get(item.productId)!;
      const available = product.stockQuantity - product.reservedStock;
      if (product.trackInventory && available < item.quantity && !product.allowBackorder) {
        return {
          success: false,
          error: `"${product.name}" does not have enough stock. Available: ${Math.max(0, available)}.`,
        };
      }
    }

    // Build lines from DB prices
    const lines: CartLine[] = input.items.map((item) => {
      const p = productMap.get(item.productId)!;
      return {
        productId: p.id,
        quantity: item.quantity,
        unitPrice: Number(p.price),
        salePrice: p.salePrice != null ? Number(p.salePrice) : null,
      };
    });

    // Coupon validation (server-side)
    let couponDiscount = 0;
    let couponCode: string | null = null;
    if (input.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: input.couponCode.toUpperCase() },
      });
      if (!coupon || !coupon.isActive) {
        return { success: false, error: "Invalid or inactive coupon code." };
      }
      const now = new Date();
      if (coupon.startsAt && coupon.startsAt > now) {
        return { success: false, error: "This coupon is not yet active." };
      }
      if (coupon.endsAt && coupon.endsAt < now) {
        return { success: false, error: "This coupon has expired." };
      }
      if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
        return { success: false, error: "This coupon has reached its usage limit." };
      }
      const subtotal = lines.reduce((s, l) => {
        const price = l.salePrice != null && l.salePrice < l.unitPrice ? l.salePrice : l.unitPrice;
        return s + price * l.quantity;
      }, 0);
      if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
        return {
          success: false,
          error: `Minimum order of Rs. ${coupon.minOrderAmount} required for this coupon.`,
        };
      }
      if (coupon.type === "PERCENTAGE") {
        couponDiscount = (subtotal * Number(coupon.value)) / 100;
        if (coupon.maxDiscount) {
          couponDiscount = Math.min(couponDiscount, Number(coupon.maxDiscount));
        }
      } else {
        couponDiscount = Number(coupon.value);
      }
      couponCode = coupon.code;
    }

    const totals = calculateOrderTotals({
      lines,
      couponDiscount,
    });

    // Generate sequential-ish order number
    const year = new Date().getFullYear();
    const count = await prisma.order.count({
      where: { createdAt: { gte: new Date(`${year}-01-01`) } },
    });
    const orderNumber = generateOrderNumber(count + 1, year);
    const trackingId = orderNumber; // same for simplicity; can diverge later
    const invoiceNumber = generateInvoiceNumber(count + 1, year);

    const order = await prisma.$transaction(async (tx) => {
      // Re-check stock inside transaction
      for (const item of input.items) {
        const p = await tx.product.findUnique({ where: { id: item.productId } });
        if (!p) throw new Error("Product not found");
        const available = p.stockQuantity - p.reservedStock;
        if (p.trackInventory && available < item.quantity && !p.allowBackorder) {
          throw new Error(`Insufficient stock for ${p.name}`);
        }
      }

      // Decrement stock
      for (const item of input.items) {
        const p = productMap.get(item.productId)!;
        if (p.trackInventory) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { decrement: item.quantity } },
          });
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              quantity: -item.quantity,
              type: "SALE",
              reason: `Order ${orderNumber}`,
            },
          });
        }
      }

      // Create order
      const created = await tx.order.create({
        data: {
          orderNumber,
          trackingId,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          shippingLine1: input.shippingLine1,
          shippingLine2: input.shippingLine2 || null,
          shippingCity: input.shippingCity,
          shippingProvince: input.shippingProvince,
          shippingPostalCode: input.shippingPostalCode || null,
          deliveryNotes: input.deliveryNotes || null,
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          shippingAmount: totals.shippingAmount,
          total: totals.total,
          paymentMethod: input.paymentMethod || "COD",
          paymentStatus: "PENDING",
          status: "PLACED",
          couponCode,
          couponDiscount: couponDiscount > 0 ? couponDiscount : null,
          items: {
            create: input.items.map((item) => {
              const p = productMap.get(item.productId)!;
              const unit =
                p.salePrice != null && Number(p.salePrice) < Number(p.price)
                  ? Number(p.salePrice)
                  : Number(p.price);
              return {
                productId: p.id,
                productNameSnapshot: p.name,
                skuSnapshot: p.sku,
                unitPrice: unit,
                discountAmount: 0,
                quantity: item.quantity,
                finalPrice: unit * item.quantity,
                imageUrlSnapshot: p.images[0]?.url || null,
              };
            }),
          },
          statusHistory: {
            create: {
              status: "PLACED",
              note: "Order placed by customer",
            },
          },
          trackingEvents: {
            create: {
              status: "PLACED",
              title: TRACKING_STATUS_COPY.PLACED.title,
              description: TRACKING_STATUS_COPY.PLACED.description,
              eventAt: new Date(),
            },
          },
          invoice: {
            create: {
              invoiceNumber,
            },
          },
        },
      });

      // Increment coupon usage
      if (couponCode) {
        await tx.coupon.update({
          where: { code: couponCode },
          data: { usageCount: { increment: 1 } },
        });
      }

      return created;
    });

    // Email failures must not undo an order that has already been created.
    try {
      const {
        sendEmail,
        orderReceivedEmailHtml,
        newOrderNotificationEmailHtml,
      } = await import("@/lib/email/client");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const formatRupees = (amount: number) =>
        `Rs. ${amount.toLocaleString("en-PK")}`;
      const customerEmail = sendEmail({
        to: input.customerEmail,
        subject: `Your Mini Street order ${order.orderNumber} is confirmed`,
        html: orderReceivedEmailHtml({
          customerName: input.customerName,
          orderNumber: order.orderNumber,
          trackingId: order.trackingId,
          total: formatRupees(Number(order.total)),
          trackUrl: `${appUrl}/track-order/${order.trackingId}`,
        }),
        template: "order-received",
        orderId: order.id,
      });
      const notificationEmail = process.env.ORDER_NOTIFICATION_EMAIL || process.env.GMAIL_USER;
      const ownerEmail = notificationEmail
        ? sendEmail({
            to: notificationEmail,
            subject: `New Mini Street order ${order.orderNumber}`,
            html: newOrderNotificationEmailHtml({
              customerName: input.customerName,
              customerEmail: input.customerEmail,
              customerPhone: input.customerPhone,
              orderNumber: order.orderNumber,
              items: input.items.map((item) => {
                const product = productMap.get(item.productId)!;
                const unitPrice =
                  product.salePrice != null &&
                  Number(product.salePrice) < Number(product.price)
                    ? Number(product.salePrice)
                    : Number(product.price);
                return {
                  name: product.name,
                  quantity: item.quantity,
                  lineTotal: formatRupees(unitPrice * item.quantity),
                };
              }),
              subtotal: formatRupees(totals.subtotal),
              shipping: formatRupees(totals.shippingAmount),
              total: formatRupees(Number(order.total)),
              shippingAddress: [
                input.shippingLine1,
                input.shippingLine2,
                input.shippingCity,
                input.shippingProvince,
                input.shippingPostalCode,
              ]
                .filter(Boolean)
                .join(", "),
            }),
            template: "new-order-notification",
            orderId: order.id,
          })
        : Promise.resolve({
            success: false,
            error: "Set ORDER_NOTIFICATION_EMAIL to receive order notifications.",
          });
      const emailResults = await Promise.all([customerEmail, ownerEmail]);
      for (const result of emailResults) {
        if (!result.success) {
          console.error("[createOrder:email]", result.error);
        }
      }
    } catch (emailErr) {
      console.error("[createOrder:email]", emailErr);
    }

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      trackingId: order.trackingId,
      total: Number(order.total),
    };
  } catch (err) {
    console.error("[createOrder]", err);
    const message =
      err instanceof Error ? err.message : "Something went wrong placing your order.";
    return { success: false, error: message };
  }
}
