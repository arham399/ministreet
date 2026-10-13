/**
 * Sends email through Gmail SMTP when Gmail credentials are configured.
 */
import nodemailer from "nodemailer";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/constants";

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
    const { getDrizzleClient } = await import("@/lib/db/drizzle/client");
    const { emailLog } = await import("@/lib/db/drizzle/schema");
    await getDrizzleClient().db.insert(emailLog).values({
      to: data.to,
      subject: data.subject,
      template: data.template,
      status: data.status,
      error: data.error ?? null,
      orderId: data.orderId ?? null,
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
  items: { name: string; quantity: number; lineTotal: string }[];
  subtotal: string;
  shipping: string;
  discount?: string | null;
  total: string;
  trackUrl: string;
}) {
  const itemRows = opts.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 8px;border-bottom:1px solid #f3dce9;color:#30252d;font-size:14px;line-height:1.5">${escapeHtml(item.name)}</td>
          <td style="padding:12px 8px;border-bottom:1px solid #f3dce9;color:#746b72;font-size:14px;text-align:center;white-space:nowrap">× ${item.quantity}</td>
          <td style="padding:12px 8px;border-bottom:1px solid #f3dce9;color:#30252d;font-size:14px;text-align:right;white-space:nowrap">${escapeHtml(item.lineTotal)}</td>
        </tr>`,
    )
    .join("");
  const discountRow = opts.discount
    ? `<tr><td colspan="2" style="padding:6px 8px;color:#746b72;font-size:14px;text-align:right">Discount</td><td style="padding:6px 8px;color:#b81770;font-size:14px;text-align:right;white-space:nowrap">−${escapeHtml(opts.discount)}</td></tr>`
    : "";

  return `
  <div style="margin:0;background:#fff8fb;padding:32px 12px;font-family:Arial,Helvetica,sans-serif;color:#30252d">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0">Order ${escapeHtml(opts.orderNumber)} is confirmed. Thank you for shopping with Mini Street.</span>
    <table role="presentation" style="width:100%;max-width:600px;margin:0 auto;border-collapse:collapse;background:#fff;border:1px solid #f3dce9;border-radius:16px;overflow:hidden">
      <tr>
        <td style="padding:24px;text-align:center;background:#e91e8c;color:#fff">
          <div style="font-family:Georgia,serif;font-size:30px;font-weight:bold;letter-spacing:1px">MINI STREET</div>
          <div style="margin-top:5px;font-size:11px;letter-spacing:3px">ADORABLY ENCHANTING TREASURES</div>
        </td>
      </tr>
      <tr>
        <td style="padding:34px 28px 28px">
          <p style="margin:0 0 10px;color:#e91e8c;font-size:11px;font-weight:bold;letter-spacing:3px">ORDER CONFIRMED</p>
          <h1 style="margin:0 0 14px;font-family:Georgia,serif;font-size:30px;font-weight:normal;line-height:1.25;color:#30252d">Thank you, ${escapeHtml(opts.customerName)}!</h1>
          <p style="margin:0 0 22px;color:#746b72;font-size:15px;line-height:1.7">Your order is safely with us. We’ll prepare your treasures with care.</p>
          <table role="presentation" style="width:100%;margin:0 0 24px;border-collapse:collapse;background:#fff8fb;border:1px solid #f3dce9;border-radius:10px">
            <tr>
              <td style="padding:13px 15px;color:#746b72;font-size:13px">Order number</td>
              <td style="padding:13px 15px;color:#30252d;font-size:14px;font-weight:bold;text-align:right">${escapeHtml(opts.orderNumber)}</td>
            </tr>
            <tr>
              <td style="padding:0 15px 13px;color:#746b72;font-size:13px">Tracking ID</td>
              <td style="padding:0 15px 13px;color:#30252d;font-size:14px;font-weight:bold;text-align:right">${escapeHtml(opts.trackingId)}</td>
            </tr>
          </table>
          <h2 style="margin:0 0 10px;color:#30252d;font-size:16px">Your order</h2>
          <table role="presentation" style="width:100%;border-collapse:collapse">
            <thead>
              <tr>
                <th style="padding:8px;text-align:left;border-bottom:1px solid #f3dce9;color:#887c84;font-size:11px;font-weight:normal;letter-spacing:1px">ITEM</th>
                <th style="padding:8px;text-align:center;border-bottom:1px solid #f3dce9;color:#887c84;font-size:11px;font-weight:normal;letter-spacing:1px">QTY</th>
                <th style="padding:8px;text-align:right;border-bottom:1px solid #f3dce9;color:#887c84;font-size:11px;font-weight:normal;letter-spacing:1px">AMOUNT</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
            <tfoot>
              <tr><td colspan="2" style="padding:12px 8px 5px;color:#746b72;font-size:14px;text-align:right">Subtotal</td><td style="padding:12px 8px 5px;color:#30252d;font-size:14px;text-align:right;white-space:nowrap">${escapeHtml(opts.subtotal)}</td></tr>
              ${discountRow}
              <tr><td colspan="2" style="padding:6px 8px;color:#746b72;font-size:14px;text-align:right">Delivery</td><td style="padding:6px 8px;color:#30252d;font-size:14px;text-align:right;white-space:nowrap">${escapeHtml(opts.shipping)}</td></tr>
              <tr><td colspan="2" style="padding:12px 8px;border-top:1px solid #f3dce9;color:#30252d;font-size:16px;font-weight:bold;text-align:right">Total</td><td style="padding:12px 8px;border-top:1px solid #f3dce9;color:#b81770;font-size:17px;font-weight:bold;text-align:right;white-space:nowrap">${escapeHtml(opts.total)}</td></tr>
            </tfoot>
          </table>
          <table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0" style="margin:28px auto 0"><tr><td align="center" bgcolor="#e91e8c" style="border-radius:8px"><a href="${escapeHtml(opts.trackUrl)}" style="display:inline-block;padding:14px 28px;border-radius:8px;background:#e91e8c;color:#fff;font-size:15px;font-weight:bold;line-height:20px;text-align:center;text-decoration:none">Track your order</a></td></tr></table>
          <p style="margin:14px 0 0;color:#887c84;font-size:12px;line-height:1.6;text-align:center">We’ll keep you updated as your order makes its way to you.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 28px 24px;border-top:1px solid #f3dce9;text-align:center;color:#887c84;font-size:12px;line-height:1.7">
          <p style="margin:0 0 6px;color:#30252d;font-family:Georgia,serif;font-size:16px">With love, Mini Street</p>
          <p style="margin:0">Questions about your order? <a href="mailto:${escapeHtml(CONTACT_EMAIL)}" style="color:#b81770">Contact our team</a>.</p>
        </td>
      </tr>
    </table>
  </div>`;
}

export function orderOutForDeliveryEmailHtml(opts: {
  customerName: string;
  orderNumber: string;
  trackingId: string;
  courierName?: string | null;
  courierTracking?: string | null;
  trackUrl: string;
}) {
  const courierDetails =
    opts.courierName || opts.courierTracking
      ? `<table role="presentation" style="width:100%;margin:22px 0 0;border-collapse:collapse;background:#fff8fb;border:1px solid #f3dce9;border-radius:10px">
          ${opts.courierName ? `<tr><td style="padding:12px 14px;color:#746b72;font-size:13px">Courier</td><td style="padding:12px 14px;color:#30252d;font-size:14px;font-weight:bold;text-align:right">${escapeHtml(opts.courierName)}</td></tr>` : ""}
          ${opts.courierTracking ? `<tr><td style="padding:0 14px 12px;color:#746b72;font-size:13px">Courier tracking number</td><td style="padding:0 14px 12px;color:#30252d;font-size:14px;font-weight:bold;text-align:right">${escapeHtml(opts.courierTracking)}</td></tr>` : ""}
        </table>`
      : "";

  return `
  <div style="margin:0;background:#fff8fb;padding:32px 12px;font-family:Arial,Helvetica,sans-serif;color:#30252d">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0">Your Mini Street order ${escapeHtml(opts.orderNumber)} is out for delivery today.</span>
    <table role="presentation" style="width:100%;max-width:600px;margin:0 auto;border-collapse:collapse;background:#fff;border:1px solid #f3dce9;border-radius:16px;overflow:hidden">
      <tr>
        <td style="padding:24px;text-align:center;background:#e91e8c;color:#fff">
          <div style="font-family:Georgia,serif;font-size:30px;font-weight:bold;letter-spacing:1px">MINI STREET</div>
          <div style="margin-top:5px;font-size:11px;letter-spacing:3px">ADORABLY ENCHANTING TREASURES</div>
        </td>
      </tr>
      <tr>
        <td style="padding:34px 28px 30px">
          <p style="margin:0 0 10px;color:#e91e8c;font-size:11px;font-weight:bold;letter-spacing:3px">DELIVERY UPDATE</p>
          <h1 style="margin:0 0 14px;font-family:Georgia,serif;font-size:30px;font-weight:normal;line-height:1.25;color:#30252d">Your parcel is on its way!</h1>
          <p style="margin:0 0 20px;color:#5f555c;font-size:16px;line-height:1.75">Hi ${escapeHtml(opts.customerName)}, your Mini Street order is <strong style="color:#b81770">out for delivery today</strong>. Please keep your phone nearby so your courier can reach you.</p>
          <table role="presentation" style="width:100%;border-collapse:collapse;background:#fff8fb;border:1px solid #f3dce9;border-radius:10px">
            <tr>
              <td style="padding:13px 15px;color:#746b72;font-size:13px">Order number</td>
              <td style="padding:13px 15px;color:#30252d;font-size:14px;font-weight:bold;text-align:right">${escapeHtml(opts.orderNumber)}</td>
            </tr>
            <tr>
              <td style="padding:0 15px 13px;color:#746b72;font-size:13px">Tracking ID</td>
              <td style="padding:0 15px 13px;color:#30252d;font-size:14px;font-weight:bold;text-align:right">${escapeHtml(opts.trackingId)}</td>
            </tr>
          </table>
          ${courierDetails}
          <table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0" style="margin:28px auto 0"><tr><td align="center" bgcolor="#e91e8c" style="border-radius:8px"><a href="${escapeHtml(opts.trackUrl)}" style="display:inline-block;padding:14px 28px;border-radius:8px;background:#e91e8c;color:#fff;font-size:15px;font-weight:bold;line-height:20px;text-align:center;text-decoration:none">Track your parcel</a></td></tr></table>
          <p style="margin:22px 0 0;color:#746b72;font-size:13px;line-height:1.7">If you need help, our team is happy to assist you at <a href="mailto:${escapeHtml(CONTACT_EMAIL)}" style="color:#b81770">${escapeHtml(CONTACT_EMAIL)}</a>.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 28px 24px;border-top:1px solid #f3dce9;text-align:center;color:#887c84;font-size:12px;line-height:1.7">
          <p style="margin:0 0 6px;color:#30252d;font-family:Georgia,serif;font-size:16px">With love, Mini Street</p>
          <p style="margin:0">Thank you for choosing our little store.</p>
        </td>
      </tr>
    </table>
  </div>`;
}

export function newOrderNotificationEmailHtml(opts: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderNumber: string;
  trackingId: string;
  items: { name: string; quantity: number; lineTotal: string }[];
  subtotal: string;
  shipping: string;
  discount?: string | null;
  total: string;
  shippingAddress: string;
}) {
  const itemRows = opts.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 8px;border-bottom:1px solid #f3dce9;color:#30252d;font-size:14px">${escapeHtml(item.name)}</td>
          <td style="padding:12px 8px;border-bottom:1px solid #f3dce9;color:#746b72;font-size:14px;text-align:center">× ${item.quantity}</td>
          <td style="padding:12px 8px;border-bottom:1px solid #f3dce9;color:#30252d;font-size:14px;text-align:right;white-space:nowrap">${escapeHtml(item.lineTotal)}</td>
        </tr>`
    )
    .join("");
  const discountRow = opts.discount
    ? `<tr><td colspan="2" style="padding:6px 8px;color:#746b72;font-size:14px;text-align:right">Discount</td><td style="padding:6px 8px;color:#b81770;font-size:14px;text-align:right;white-space:nowrap">−${escapeHtml(opts.discount)}</td></tr>`
    : "";
  const addressLines = opts.shippingAddress
    .split(", ")
    .map(escapeHtml)
    .join("<br/>");

  return `
  <div style="margin:0;background:#fff8fb;padding:32px 12px;font-family:Arial,Helvetica,sans-serif;color:#30252d">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0">New order ${escapeHtml(opts.orderNumber)} received by Mini Street.</span>
    <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;background:#fff;border:1px solid #f3dce9;border-radius:16px;overflow:hidden">
      <tr>
        <td style="padding:24px;text-align:center;background:#e91e8c;color:#fff">
          <div style="font-family:Georgia,serif;font-size:30px;font-weight:bold;letter-spacing:1px">MINI STREET</div>
          <div style="margin-top:5px;font-size:11px;letter-spacing:3px">ORDER DESK</div>
        </td>
      </tr>
      <tr>
        <td style="padding:30px 26px 28px">
          <p style="margin:0 0 10px;color:#e91e8c;font-size:11px;font-weight:bold;letter-spacing:3px">NEW ORDER RECEIVED</p>
          <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;font-weight:normal;line-height:1.25;color:#30252d">Order ${escapeHtml(opts.orderNumber)}</h1>
          <p style="margin:0 0 22px;color:#746b72;font-size:14px">Tracking ID: <strong style="color:#30252d">${escapeHtml(opts.trackingId)}</strong></p>
          <table role="presentation" style="width:100%;margin-bottom:20px;border-collapse:collapse">
            <tr>
              <td style="width:50%;padding:16px;vertical-align:top;background:#fff8fb;border:1px solid #f3dce9">
                <p style="margin:0 0 10px;color:#b81770;font-size:11px;font-weight:bold;letter-spacing:2px">CUSTOMER</p>
                <p style="margin:0 0 5px;color:#30252d;font-size:14px;font-weight:bold">${escapeHtml(opts.customerName)}</p>
                <p style="margin:0 0 5px;font-size:13px;line-height:1.6"><a href="mailto:${escapeHtml(opts.customerEmail)}" style="color:#b81770;text-decoration:none">${escapeHtml(opts.customerEmail)}</a></p>
                <p style="margin:0;color:#746b72;font-size:13px">${escapeHtml(opts.customerPhone)}</p>
              </td>
              <td style="width:50%;padding:16px;vertical-align:top;background:#fff8fb;border:1px solid #f3dce9">
                <p style="margin:0 0 10px;color:#b81770;font-size:11px;font-weight:bold;letter-spacing:2px">DELIVER TO</p>
                <p style="margin:0;color:#30252d;font-size:13px;line-height:1.7">${addressLines}</p>
              </td>
            </tr>
          </table>
          <h2 style="margin:0 0 10px;color:#30252d;font-size:16px">Items to prepare</h2>
          <table role="presentation" style="width:100%;border-collapse:collapse">
            <thead><tr><th style="padding:8px;text-align:left;border-bottom:1px solid #f3dce9;color:#887c84;font-size:11px;font-weight:normal;letter-spacing:1px">ITEM</th><th style="padding:8px;text-align:center;border-bottom:1px solid #f3dce9;color:#887c84;font-size:11px;font-weight:normal;letter-spacing:1px">QTY</th><th style="padding:8px;text-align:right;border-bottom:1px solid #f3dce9;color:#887c84;font-size:11px;font-weight:normal;letter-spacing:1px">AMOUNT</th></tr></thead>
            <tbody>${itemRows}</tbody>
            <tfoot>
              <tr><td colspan="2" style="padding:12px 8px 5px;color:#746b72;font-size:14px;text-align:right">Subtotal</td><td style="padding:12px 8px 5px;color:#30252d;font-size:14px;text-align:right;white-space:nowrap">${escapeHtml(opts.subtotal)}</td></tr>
              ${discountRow}
              <tr><td colspan="2" style="padding:6px 8px;color:#746b72;font-size:14px;text-align:right">Delivery</td><td style="padding:6px 8px;color:#30252d;font-size:14px;text-align:right;white-space:nowrap">${escapeHtml(opts.shipping)}</td></tr>
              <tr><td colspan="2" style="padding:12px 8px;border-top:1px solid #f3dce9;color:#30252d;font-size:16px;font-weight:bold;text-align:right">Order total</td><td style="padding:12px 8px;border-top:1px solid #f3dce9;color:#b81770;font-size:17px;font-weight:bold;text-align:right;white-space:nowrap">${escapeHtml(opts.total)}</td></tr>
            </tfoot>
          </table>
          <p style="margin:22px 0 0;padding:13px 15px;border-left:3px solid #e91e8c;background:#fff8fb;color:#746b72;font-size:13px;line-height:1.6">Please review the delivery details and begin preparing this order.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 26px 22px;border-top:1px solid #f3dce9;text-align:center;color:#887c84;font-size:12px;line-height:1.6">Mini Street · New order notification</td>
      </tr>
    </table>
  </div>`;
}

export function newsletterWelcomeEmailHtml(opts: { email: string }) {
  return `
  <div style="margin:0;background:#fff8fb;padding:32px 12px;font-family:Arial,Helvetica,sans-serif;color:#30252d">
    <table role="presentation" style="width:100%;max-width:600px;margin:0 auto;border-collapse:collapse;background:#fff;border:1px solid #f3dce9;border-radius:16px;overflow:hidden">
      <tr>
        <td style="padding:24px;text-align:center;background:#e91e8c;color:#fff">
          <div style="font-family:Georgia,serif;font-size:30px;font-weight:bold;letter-spacing:1px">MINI STREET</div>
          <div style="margin-top:5px;font-size:11px;letter-spacing:3px">ADORABLY ENCHANTING TREASURES</div>
        </td>
      </tr>
      <tr>
        <td style="padding:36px 30px 24px;text-align:center">
          <p style="margin:0 0 12px;color:#e91e8c;font-size:12px;font-weight:bold;letter-spacing:3px">WELCOME TO THE CLUB</p>
          <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:32px;font-weight:normal;color:#30252d">You're on the list!</h1>
          <p style="margin:0 auto 24px;max-width:440px;color:#746b72;font-size:16px;line-height:1.7">
            Thanks for joining the Mini Street Club. We'll send you lovely updates about new arrivals, special offers, and little surprises.
          </p>
          <a href="${escapeHtml(SITE_URL)}/shop" style="display:inline-block;padding:14px 26px;border-radius:8px;background:#e91e8c;color:#fff;font-size:15px;font-weight:bold;text-decoration:none">Explore the collection</a>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 28px 26px;border-top:1px solid #f3dce9;text-align:center;color:#887c84;font-size:12px;line-height:1.7">
          <p style="margin:0 0 8px">With love, Mini Street</p>
          <p style="margin:0">Prefer not to receive these updates? <a href="mailto:${CONTACT_EMAIL}?subject=Unsubscribe%20from%20Mini%20Street%20newsletter" style="color:#b81770">Contact us to unsubscribe</a>.</p>
        </td>
      </tr>
    </table>
  </div>`;
}

export function newsletterCampaignEmailHtml(opts: {
  subject: string;
  message: string;
  buttonText?: string;
  buttonUrl?: string;
  email: string;
}) {
  const paragraphs = opts.message
    .trim()
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => escapeHtml(paragraph).replace(/\r?\n/g, "<br/>"))
    .map((paragraph) => `<p style="margin:0 0 18px;color:#5f555c;font-size:16px;line-height:1.75">${paragraph}</p>`)
    .join("");
  const buttonUrl = opts.buttonUrl
    ? opts.buttonUrl.startsWith("/")
      ? `${SITE_URL}${opts.buttonUrl}`
      : opts.buttonUrl
    : null;
  const callToAction =
    buttonUrl && opts.buttonText
      ? `<table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0" style="margin:28px auto 0"><tr><td align="center" bgcolor="#e91e8c" style="border-radius:8px"><a href="${escapeHtml(buttonUrl)}" style="display:inline-block;padding:14px 28px;border-radius:8px;background:#e91e8c;color:#fff;font-size:15px;font-weight:bold;line-height:20px;text-align:center;text-decoration:none">${escapeHtml(opts.buttonText)}</a></td></tr></table>`
      : "";

  return `
  <div style="margin:0;background:#fff8fb;padding:32px 12px;font-family:Arial,Helvetica,sans-serif;color:#30252d">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0">${escapeHtml(opts.subject)}</span>
    <table role="presentation" style="width:100%;max-width:600px;margin:0 auto;border-collapse:collapse;background:#fff;border:1px solid #f3dce9;border-radius:16px;overflow:hidden">
      <tr>
        <td style="padding:24px;text-align:center;background:#e91e8c;color:#fff">
          <div style="font-family:Georgia,serif;font-size:30px;font-weight:bold;letter-spacing:1px">MINI STREET</div>
          <div style="margin-top:5px;font-size:11px;letter-spacing:3px">ADORABLY ENCHANTING TREASURES</div>
        </td>
      </tr>
      <tr>
        <td style="padding:36px 30px 32px">
          <p style="margin:0 0 12px;color:#e91e8c;font-size:11px;font-weight:bold;letter-spacing:3px">A NOTE FROM MINI STREET</p>
          <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:29px;font-weight:normal;line-height:1.25;color:#30252d">${escapeHtml(opts.subject)}</h1>
          ${paragraphs}
          ${callToAction}
        </td>
      </tr>
      <tr>
        <td style="padding:20px 28px 26px;border-top:1px solid #f3dce9;text-align:center;color:#887c84;font-size:12px;line-height:1.7">
          <p style="margin:0 0 8px">With love, Mini Street</p>
          <p style="margin:0">You received this because you joined the Mini Street Club. To stop receiving these emails, <a href="mailto:${CONTACT_EMAIL}?subject=Unsubscribe%20from%20Mini%20Street%20newsletter" style="color:#b81770">contact us</a>.</p>
        </td>
      </tr>
    </table>
  </div>`;
}

export function newsletterSubscriptionNotificationEmailHtml(opts: {
  email: string;
  manageUrl: string;
}) {
  return `
  <div style="margin:0;background:#f7f5f6;padding:32px 12px;font-family:Arial,Helvetica,sans-serif;color:#30252d">
    <div style="max-width:560px;margin:0 auto;padding:28px;background:#fff;border:1px solid #eee;border-radius:12px">
      <p style="margin:0 0 8px;color:#e91e8c;font-size:12px;font-weight:bold;letter-spacing:2px">NEWSLETTER UPDATE</p>
      <h1 style="margin:0 0 20px;font-size:24px">New Mini Street subscriber</h1>
      <p style="margin:0 0 8px;color:#746b72">A new email address joined the newsletter:</p>
      <p style="margin:0 0 24px;font-size:18px;font-weight:bold"><a href="mailto:${escapeHtml(opts.email)}" style="color:#b81770">${escapeHtml(opts.email)}</a></p>
      <a href="${escapeHtml(opts.manageUrl)}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#e91e8c;color:#fff;font-weight:bold;text-decoration:none">Manage subscribers</a>
    </div>
  </div>`;
}
