/**
 * Sends email through Gmail SMTP when Gmail credentials are configured.
 */
import nodemailer from "nodemailer";

const gmailUser = process.env.GMAIL_USER;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
const transporter =
  gmailUser && gmailAppPassword
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailAppPassword },
      })
    : null;

async function logEmail(data: {
  to: string;
  subject: string;
  template: string;
  status: "SENT" | "FAILED";
  error?: string;
  orderId?: string;
}) {
  try {
    const { prisma } = await import("@/lib/db/prisma");
    await prisma.emailLog.create({
      data: {
        to: data.to,
        subject: data.subject,
        template: data.template,
        status: data.status,
        error: data.error,
        orderId: data.orderId,
      },
    });
  } catch (err) {
    console.error("[email:log]", err);
  }
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  template?: string;
  orderId?: string;
}) {
  const { to, subject, html, template = "generic", orderId } = params;

  if (!transporter || !gmailUser) {
    const error = "Gmail SMTP is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env.";
    console.error("[email]", error);
    await logEmail({ to, subject, template, status: "FAILED", error, orderId });
    return { success: false, error };
  }

  try {
    const result = await transporter.sendMail({
      from: `Mini Street <${gmailUser}>`,
      to,
      subject,
      html,
    });
    await logEmail({ to, subject, template, status: "SENT", orderId });
    return { success: true, id: result.messageId };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown SMTP error";
    console.error("[email]", err);
    await logEmail({ to, subject, template, status: "FAILED", error, orderId });
    return { success: false, error: "Send failed" };
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export function orderReceivedEmailHtml(opts: {
  customerName: string;
  orderNumber: string;
  trackingId: string;
  total: string;
  trackUrl: string;
}) {
  return `
  <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#252126">
    <h1 style="color:#E91E8C">Mini Street</h1>
    <p>Hi ${escapeHtml(opts.customerName)},</p>
    <p>Thank you for your order <strong>${escapeHtml(opts.orderNumber)}</strong> 💗</p>
    <p>Total: <strong>${escapeHtml(opts.total)}</strong></p>
    <p><a href="${escapeHtml(opts.trackUrl)}" style="background:#E91E8C;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Track your order</a></p>
    <p style="color:#746B72;font-size:13px">Tracking ID: ${escapeHtml(opts.trackingId)}</p>
  </div>`;
}

export function newOrderNotificationEmailHtml(opts: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderNumber: string;
  items: { name: string; quantity: number; lineTotal: string }[];
  subtotal: string;
  shipping: string;
  total: string;
  shippingAddress: string;
}) {
  const itemRows = opts.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(item.name)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${escapeHtml(item.lineTotal)}</td>
        </tr>`
    )
    .join("");

  return `
  <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#252126">
    <h1 style="color:#E91E8C">New Mini Street order</h1>
    <p>Order <strong>${escapeHtml(opts.orderNumber)}</strong> has been placed.</p>
    <h2 style="font-size:16px">Customer</h2>
    <p>${escapeHtml(opts.customerName)}<br/>
      <a href="mailto:${escapeHtml(opts.customerEmail)}">${escapeHtml(opts.customerEmail)}</a><br/>
      ${escapeHtml(opts.customerPhone)}</p>
    <p><strong>Delivery address:</strong><br/>${escapeHtml(opts.shippingAddress)}</p>
    <h2 style="font-size:16px">Items</h2>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr><th style="text-align:left;padding:8px">Product</th><th>Qty</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
    <p style="text-align:right">Subtotal: ${escapeHtml(opts.subtotal)}<br/>
      Shipping: ${escapeHtml(opts.shipping)}<br/>
      <strong>Total: ${escapeHtml(opts.total)}</strong></p>
  </div>`;
}
