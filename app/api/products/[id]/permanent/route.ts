import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { can } from "@/lib/auth/permissions";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { auditLog, inventoryMovement, order, orderItem, product, productImage } from "@/lib/db/drizzle/schema";
import { deleteProductImagesFromCloudinary } from "@/lib/storage/uploads";

type Ctx = { params: Promise<{ id: string }> };
const COMPLETED_ORDER_STATUSES = ["DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"] as const;

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "products:write")) {
    return NextResponse.json({ error: "You don't have permission to delete products." }, { status: 403 });
  }

  const { id } = await ctx.params;
  const { db } = getDrizzleClient();
  const result = await db.transaction(async (tx) => {
    const [found] = await tx.select({ id: product.id, name: product.name })
      .from(product).where(eq(product.id, id)).for("update");
    if (!found) return { kind: "not-found" as const };

    const linkedOrders = await tx.select({ orderNumber: order.orderNumber, status: order.status })
      .from(orderItem)
      .innerJoin(order, eq(orderItem.orderId, order.id))
      .where(eq(orderItem.productId, id));
    const activeOrders = linkedOrders.filter(({ status }) =>
      !COMPLETED_ORDER_STATUSES.includes(status as (typeof COMPLETED_ORDER_STATUSES)[number]),
    );
    if (activeOrders.length) {
      return {
        kind: "blocked" as const,
        orderNumbers: activeOrders.slice(0, 3).map(({ orderNumber }) => orderNumber),
        additionalCount: Math.max(0, activeOrders.length - 3),
      };
    }

    const images = await tx.select({ url: productImage.url }).from(productImage)
      .where(eq(productImage.productId, id));
    // Preserve order line snapshots, while removing product-only inventory history
    // that has a restrictive foreign key to Product.
    await tx.delete(inventoryMovement).where(eq(inventoryMovement.productId, id));
    await tx.delete(product).where(eq(product.id, id));
    await tx.insert(auditLog).values({
      id: globalThis.crypto.randomUUID(),
      actorId: session.user.id,
      action: "PRODUCT_PERMANENTLY_DELETED",
      entityType: "Product",
      entityId: id,
      metadata: { productName: found.name },
    });
    return { kind: "deleted" as const, imageUrls: images.map(({ url }) => url) };
  });

  if (result.kind === "not-found") {
    return NextResponse.json({ error: "This product no longer exists." }, { status: 404 });
  }
  if (result.kind === "blocked") {
    const orders = result.orderNumbers.join(", ");
    const more = result.additionalCount ? ` and ${result.additionalCount} more` : "";
    return NextResponse.json({
      error: `This product is included in an order that has not been completed yet (${orders}${more}). Complete or cancel those orders before permanently deleting it.`,
    }, { status: 409 });
  }

  const storage = await deleteProductImagesFromCloudinary(result.imageUrls);
  const warning = storage.failed
    ? "The product was deleted, but some uploaded images could not be removed from Cloudinary."
    : storage.skipped
      ? "The product was deleted. Images hosted outside this product's Cloudinary folder were left untouched."
      : undefined;
  return NextResponse.json({ success: true, warning });
}
