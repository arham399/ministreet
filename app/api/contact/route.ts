import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { contactMessage } from "@/lib/db/drizzle/schema";
import { CONTACT_EMAIL } from "@/lib/constants";
import { contactMessageNotificationEmailHtml, sendEmail } from "@/lib/email/client";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  orderNumber: z.string().trim().max(50).optional().nullable(),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(10).max(2000),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }
    const message = parsed.data;
    const notificationEmail =
      process.env.CONTACT_FORM_NOTIFICATION_EMAIL ||
      process.env.ORDER_NOTIFICATION_EMAIL ||
      process.env.OWNER_EMAIL ||
      process.env.GMAIL_USER ||
      CONTACT_EMAIL;

    const [stored, emailResult] = await Promise.all([
      (async () => {
        try {
          const { db } = getDrizzleClient();
          await db.insert(contactMessage).values({
            id: globalThis.crypto.randomUUID(),
            ...message,
          });
          return true;
        } catch (error) {
          console.error("[contact:database] Could not store contact message", error);
          return false;
        }
      })(),
      sendEmail({
        to: notificationEmail,
        replyTo: message.email,
        subject: `Website contact: ${message.subject}`,
        html: contactMessageNotificationEmailHtml(message),
        template: "contact-message-notification",
      }).catch((error) => {
        console.error("[contact:email] Could not send owner notification", error);
        return { success: false as const, error: "Send failed" };
      }),
    ]);

    if (!emailResult.success) {
      const savedMessage = stored ? " Your message was saved, so please avoid submitting it again." : "";
      return NextResponse.json({
        error: `We could not email our team. Please contact us directly at ${CONTACT_EMAIL}.${savedMessage}`,
        saved: stored,
      }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[contact] Request failed", err);
    return NextResponse.json({ error: "We could not process your message. Please try again or email us directly." }, { status: 500 });
  }
}
