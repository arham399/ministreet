/**
 * Generate a simple binary PDF invoice without external PDF libraries.
 * Produces valid PDF 1.4 with text content.
 */
import { prisma } from "@/lib/db/prisma";

function escapePdfText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildPdf(lines: string[]): Buffer {
  const contentLines = lines
    .map((line, i) => `BT /F1 11 Tf 50 ${750 - i * 16} Td (${escapePdfText(line)}) Tj ET`)
    .join("\n");

  const stream = `BT /F1 16 Tf 50 780 Td (${escapePdfText("MINI STREET")}) Tj ET\n` + contentLines;

  const objects: string[] = [];
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  objects.push(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
  );
  objects.push(
    `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`
  );
  objects.push("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }
  const xrefPos = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefPos}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

export async function generateInvoicePdf(orderId: string): Promise<{
  buffer: Buffer;
  filename: string;
} | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, invoice: true },
  });
  if (!order) return null;

  const inv = order.invoice?.invoiceNumber || `INV-${order.orderNumber}`;
  const lines: string[] = [
    "Adorably Enchanting Treasures",
    "",
    `Invoice: ${inv}`,
    `Order: ${order.orderNumber}`,
    `Date: ${order.createdAt.toISOString().slice(0, 10)}`,
    "",
    `Bill to: ${order.customerName}`,
    order.customerEmail,
    order.customerPhone,
    "",
    `Ship to: ${order.shippingLine1}`,
    `${order.shippingCity}, ${order.shippingProvince}`,
    "",
    "--- Items ---",
  ];

  for (const item of order.items) {
    lines.push(
      `${item.productNameSnapshot} x${item.quantity}  Rs.${Number(item.finalPrice).toFixed(0)}`
    );
  }

  lines.push(
    "",
    `Subtotal: Rs.${Number(order.subtotal).toFixed(0)}`,
    `Discount: Rs.${Number(order.discountAmount).toFixed(0)}`,
    `Shipping: Rs.${Number(order.shippingAmount).toFixed(0)}`,
    `TOTAL: Rs.${Number(order.total).toFixed(0)}`,
    "",
    `Payment: ${order.paymentMethod}`,
    "",
    "Thank you for shopping with Mini Street"
  );

  const buffer = buildPdf(lines);
  return { buffer, filename: `${inv}.pdf` };
}
