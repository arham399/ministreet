/**
 * Transactional order creation — server only.
 * Never trusts client prices. Recalculates everything from DB.
 */
import { and, count, eq, gte, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import {
  coupon as couponTable,
  discount,
  inventoryMovement,
  invoice,
  order,
  orderItem,
  orderStatusHistory,
  product,
  productImage,
  trackingEvent,
} from "@/lib/db/drizzle/schema";
import { calculateOrderTotals, calculateSubtotal, type CartLine } from "@/lib/pricing/calculate";
import { generateOrderNumber, generateInvoiceNumber } from "@/lib/utils";
import type { CheckoutInput } from "@/lib/validation/checkout";
import { TRACKING_STATUS_COPY } from "@/lib/constants";
import { validateCouponForCart } from "@/lib/coupons/validate-coupon";
import { applyAutomaticDiscounts } from "@/lib/discounts/apply-automatic-discounts";
import { getActiveAutomaticDiscounts } from "@/lib/discounts/queries";

export type CreateOrderResult =
  | { success: true; orderId: string; orderNumber: string; trackingId: string; total: number }
  | { success: false; error: string };

export async function createOrder(input: CheckoutInput): Promise<CreateOrderResult> {
  try {
    const { db } = getDrizzleClient();
    const productIds = input.items.map((i) => i.productId);
    const productRows = await db
      .select()
      .from(product)
      .where(and(inArray(product.id, productIds), eq(product.isActive, true), isNull(product.archivedAt)));
    const primaryImages = productRows.length
      ? await db
          .select({ productId: productImage.productId, url: productImage.url })
          .from(productImage)
          .where(and(inArray(productImage.productId, productRows.map((item) => item.id)), eq(productImage.isPrimary, true)))
      : [];
    const imageByProduct = new Map(primaryImages.map((image) => [image.productId, image.url]));
    const products = productRows.map((item) => ({
      ...item,
      images: imageByProduct.has(item.id) ? [{ url: imageByProduct.get(item.id)! }] : [],
    }));

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

    // Apply the best eligible automatic discount using current database prices.
    const baseLines: CartLine[] = input.items.map((item) => {
      const p = productMap.get(item.productId)!;
      return {
        productId: p.id,
        quantity: item.quantity,
        unitPrice: Number(p.price),
        salePrice: p.salePrice != null ? Number(p.salePrice) : null,
      };
    });
    const automaticDiscountRules = await getActiveAutomaticDiscounts();
    const automaticPrices = applyAutomaticDiscounts(
      products,
      automaticDiscountRules,
      calculateSubtotal(baseLines),
    );
    const lines = baseLines.map((line) => ({
      ...line,
      salePrice: automaticPrices.get(line.productId)!.unitPrice,
    }));

    // Coupon validation (server-side)
    let couponDiscount = 0;
    let couponCode: string | null = null;
    let couponCampaignId: string | null = null;
    if (input.couponCode) {
      const [coupon] = await db
        .select()
        .from(couponTable)
        .where(eq(couponTable.code, input.couponCode.toUpperCase()))
        .limit(1);
      if (!coupon) {
        return { success: false, error: "Invalid or inactive coupon code." };
      }
      let customerUsageCount = 0;
      if (coupon.perCustomerLimit != null) {
        const priorCouponOrders = await db
          .select({ customerEmail: order.customerEmail })
          .from(order)
          .where(
            and(
              eq(order.couponCode, coupon.code),
              coupon.campaignId === "legacy"
                ? or(eq(order.couponCampaignId, "legacy"), isNull(order.couponCampaignId))
                : eq(order.couponCampaignId, coupon.campaignId),
            ),
          );
        customerUsageCount = priorCouponOrders.filter(
          (order) => order.customerEmail.toLowerCase() === input.customerEmail.toLowerCase(),
        ).length;
      }

      const validation = validateCouponForCart(
        coupon as unknown as Parameters<typeof validateCouponForCart>[0],
        lines.map((line) => ({
          ...line,
          categoryId: productMap.get(line.productId)!.categoryId,
        })),
        customerUsageCount,
      );
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
      couponDiscount = validation.discountAmount;
      couponCode = coupon.code;
      couponCampaignId = coupon.campaignId;
    }

    const totals = calculateOrderTotals({
      lines,
      couponDiscount,
    });

    // Generate sequential-ish order number
    const year = new Date().getFullYear();
    const [{ value: orderCount }] = await db
      .select({ value: count() })
      .from(order)
      .where(gte(order.createdAt, new Date(`${year}-01-01`)));
    const orderNumber = generateOrderNumber(orderCount + 1, year);
    const trackingId = orderNumber; // same for simplicity; can diverge later
    const invoiceNumber = generateInvoiceNumber(orderCount + 1, year);

    const createdOrder = await db.transaction(async (tx) => {
      // Re-check stock inside transaction
      for (const item of input.items) {
        const [p] = await tx.select().from(product).where(eq(product.id, item.productId)).limit(1);
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
          await tx
            .update(product)
            .set({
              stockQuantity: sql`${product.stockQuantity} - ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(product.id, item.productId));
          await tx.insert(inventoryMovement).values({
            productId: item.productId,
            quantity: -item.quantity,
            type: "SALE",
            reason: `Order ${orderNumber}`,
          });
        }
      }

      const appliedDiscountIds = new Set(
        [...automaticPrices.values()]
          .map((price) => price.discountId)
          .filter((id): id is string => id !== null),
      );
      for (const discountId of appliedDiscountIds) {
        const rule = automaticDiscountRules.find((discount) => discount.id === discountId);
        if (!rule) continue;
        const now = new Date();
        const updated = await tx
          .update(discount)
          .set({ usageCount: sql`${discount.usageCount} + 1`, updatedAt: now })
          .where(
            and(
              eq(discount.id, rule.id),
              eq(discount.isActive, true),
              eq(discount.usageCount, rule.usageCount),
              rule.usageLimit === null
                ? isNull(discount.usageLimit)
                : eq(discount.usageLimit, rule.usageLimit),
              or(isNull(discount.startsAt), lte(discount.startsAt, now)),
              or(isNull(discount.endsAt), gte(discount.endsAt, now)),
            ),
          )
          .returning({ id: discount.id });
        if (updated.length !== 1) {
          throw new Error("An applied discount changed while your order was being placed. Please review your cart and try again.");
        }
      }

      // Create order
      const [created] = await tx.insert(order).values({
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
          subtotal: String(totals.subtotal),
          discountAmount: String(totals.discountAmount),
          shippingAmount: String(totals.shippingAmount),
          total: String(totals.total),
          paymentMethod: input.paymentMethod || "COD",
          paymentStatus: "PENDING",
          status: "PLACED",
          couponCode,
          couponCampaignId,
          couponDiscount: couponDiscount > 0 ? String(couponDiscount) : null,
          updatedAt: new Date(),
        }).returning();

      await tx.insert(orderItem).values(
        input.items.map((item) => {
          const p = productMap.get(item.productId)!;
          const unit = automaticPrices.get(p.id)!.unitPrice;
          return {
            orderId: created.id,
            productId: p.id,
            productNameSnapshot: p.name,
            skuSnapshot: p.sku,
            unitPrice: String(unit),
            discountAmount: "0",
            quantity: item.quantity,
            finalPrice: String(unit * item.quantity),
            imageUrlSnapshot: p.images[0]?.url || null,
          };
        }),
      );
      await tx.insert(orderStatusHistory).values({
        orderId: created.id,
        status: "PLACED",
        note: "Order placed by customer",
      });
      await tx.insert(trackingEvent).values({
        orderId: created.id,
        status: "PLACED",
        title: TRACKING_STATUS_COPY.PLACED.title,
        description: TRACKING_STATUS_COPY.PLACED.description,
        eventAt: new Date(),
      });
      await tx.insert(invoice).values({ orderId: created.id, invoiceNumber });

      // Increment coupon usage
      if (couponCode && couponCampaignId) {
        const couponUsageUpdate = await tx
          .update(couponTable)
          .set({ usageCount: sql`${couponTable.usageCount} + 1`, updatedAt: new Date() })
          .where(and(eq(couponTable.code, couponCode), eq(couponTable.campaignId, couponCampaignId)))
          .returning({ id: couponTable.id });
        if (couponUsageUpdate.length !== 1) {
          throw new Error("This coupon changed while your order was being placed. Please review it and try again.");
        }
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
      const emailItems = input.items.map((item) => {
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
      });
      const emailDiscount =
        totals.discountAmount > 0 ? formatRupees(totals.discountAmount) : null;
      const customerEmail = sendEmail({
        to: input.customerEmail,
        subject: `Your Mini Street order ${createdOrder.orderNumber} is confirmed`,
        html: orderReceivedEmailHtml({
          customerName: input.customerName,
          orderNumber: createdOrder.orderNumber,
          trackingId: createdOrder.trackingId,
          items: emailItems,
          subtotal: formatRupees(totals.subtotal),
          shipping:
            totals.shippingAmount > 0
              ? formatRupees(totals.shippingAmount)
              : "Free",
          discount: emailDiscount,
          total: formatRupees(Number(createdOrder.total)),
          trackUrl: `${appUrl}/track-order/${createdOrder.trackingId}`,
        }),
        template: "order-received",
        orderId: createdOrder.id,
      });
      const notificationEmail = process.env.ORDER_NOTIFICATION_EMAIL || process.env.GMAIL_USER;
      const ownerEmail = notificationEmail
        ? sendEmail({
            to: notificationEmail,
            subject: `New Mini Street order ${createdOrder.orderNumber}`,
            html: newOrderNotificationEmailHtml({
              customerName: input.customerName,
              customerEmail: input.customerEmail,
              customerPhone: input.customerPhone,
              orderNumber: createdOrder.orderNumber,
              trackingId: createdOrder.trackingId,
              items: emailItems,
              subtotal: formatRupees(totals.subtotal),
              shipping:
                totals.shippingAmount > 0
                  ? formatRupees(totals.shippingAmount)
                  : "Free",
              discount: emailDiscount,
              total: formatRupees(Number(createdOrder.total)),
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
            orderId: createdOrder.id,
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
      orderId: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      trackingId: createdOrder.trackingId,
      total: Number(createdOrder.total),
    };
  } catch (err) {
    console.error("[createOrder]", err);
    const message =
      err instanceof Error ? err.message : "Something went wrong placing your order.";
    return { success: false, error: message };
  }
}
