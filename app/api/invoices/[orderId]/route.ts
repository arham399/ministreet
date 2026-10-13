import { NextRequest, NextResponse } from "next/server";
import { auth, isAdminRole } from "@/lib/auth/config";
import { eq } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { invoice, order, orderItem } from "@/lib/db/drizzle/schema";
import { formatPrice } from "@/lib/utils";
import { generateInvoicePdf } from "@/lib/invoice/generate";

type Ctx = { params: Promise<{ orderId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  const { orderId } = await ctx.params;
  const format = req.nextUrl.searchParams.get("format") || "html";

  const { db } = getDrizzleClient();
  const [foundOrder] = await db.select().from(order).where(eq(order.id, orderId)).limit(1);
  if (!foundOrder) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [items, invoices] = await Promise.all([
    db.select().from(orderItem).where(eq(orderItem.orderId, orderId)),
    db.select().from(invoice).where(eq(invoice.orderId, orderId)).limit(1),
  ]);

  const isOwner =
    session?.user &&
    (isAdminRole(session.user.role) ||
      foundOrder.userId === session.user.id ||
      foundOrder.customerEmail === session.user.email);

  if (session && !isOwner && !isAdminRole(session.user?.role)) {
    // Guests can still access with order id (shareable after checkout)
  }

  if (format === "pdf") {
    const pdf = await generateInvoicePdf(orderId);
    if (!pdf) return NextResponse.json({ error: "Failed" }, { status: 500 });
    return new NextResponse(new Uint8Array(pdf.buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdf.filename}"`,
      },
    });
  }

  const inv = invoices[0]?.invoiceNumber || `INV-${foundOrder.orderNumber}`;
  const rows = items
    .map(
      (i) =>
        `<tr><td>${i.productNameSnapshot}</td><td>${i.quantity}</td><td>${formatPrice(Number(i.unitPrice))}</td><td>${formatPrice(Number(i.finalPrice))}</td></tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Invoice ${inv}</title>
<style>
  body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;color:#252126}
  h1{color:#E91E8C;font-size:1.5rem}
  table{width:100%;border-collapse:collapse;margin:24px 0}
  th,td{border-bottom:1px solid #EDE4E8;padding:8px;text-align:left;font-size:14px}
  .muted{color:#746B72;font-size:13px}
  .total{font-weight:600;font-size:16px}
  .actions{margin-bottom:24px}
  .actions a{margin-right:12px;color:#E91E8C}
  @media print{.actions{display:none} body{margin:0}}
</style></head><body>
  <div class="actions">
    <a href="?format=pdf">Download PDF</a>
    <a href="#" onclick="window.print();return false">Print</a>
  </div>
  <h1>Mini Street</h1>
  <p class="muted">Adorably Enchanting Treasures</p>
  <p><strong>Invoice:</strong> ${inv}<br/>
  <strong>Order:</strong> ${foundOrder.orderNumber}<br/>
  <strong>Date:</strong> ${new Date(foundOrder.createdAt).toLocaleDateString()}</p>
  <p><strong>Bill to</strong><br/>${foundOrder.customerName}<br/>${foundOrder.customerEmail}<br/>${foundOrder.customerPhone}</p>
  <p><strong>Ship to</strong><br/>${foundOrder.shippingLine1}<br/>${foundOrder.shippingCity}, ${foundOrder.shippingProvince}</p>
  <table>
    <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p>Subtotal: ${formatPrice(Number(foundOrder.subtotal))}<br/>
  Discount: ${formatPrice(Number(foundOrder.discountAmount))}<br/>
  Shipping: ${formatPrice(Number(foundOrder.shippingAmount))}<br/>
  <span class="total">Total: ${formatPrice(Number(foundOrder.total))}</span></p>
  <p class="muted">Payment: ${foundOrder.paymentMethod}</p>
  <p class="muted">Thank you for shopping with Mini Street</p>
</body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
