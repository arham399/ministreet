import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { newsletterSubscriber } from "@/lib/db/drizzle/schema";
import {
  newsletterSubscriptionNotificationEmailHtml,
  newsletterWelcomeEmailHtml,
  sendEmail,
} from "@/lib/email/client";
import { SITE_URL } from "@/lib/constants";

const schema = z.object({ email: z.string().trim().email() });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    const email = parsed.data.email.trim().toLowerCase();
    const { db } = getDrizzleClient();
    const [existing] = await db
      .select({ isActive: newsletterSubscriber.isActive })
      .from(newsletterSubscriber)
      .where(eq(newsletterSubscriber.email, email))
      .limit(1);
    await db
      .insert(newsletterSubscriber)
      .values({ id: globalThis.crypto.randomUUID(), email, isActive: true })
      .onConflictDoUpdate({
        target: newsletterSubscriber.email,
        set: { isActive: true },
      });

    if (!existing?.isActive) {
      const notificationEmail =
        process.env.ORDER_NOTIFICATION_EMAIL ||
        process.env.OWNER_EMAIL ||
        process.env.GMAIL_USER;
      const emailJobs = [
        sendEmail({
          to: email,
          subject: "Welcome to the Mini Street Club!",
          html: newsletterWelcomeEmailHtml({ email }),
          template: "newsletter-welcome",
        }),
      ];

      if (notificationEmail) {
        emailJobs.push(
          sendEmail({
            to: notificationEmail,
            subject: "New Mini Street newsletter subscriber",
            html: newsletterSubscriptionNotificationEmailHtml({
              email,
              manageUrl: `${SITE_URL}/admin/newsletter`,
            }),
            template: "newsletter-subscription-notification",
          })
        );
      } else {
        console.error(
          "[newsletter] Owner notification not sent. Set ORDER_NOTIFICATION_EMAIL or OWNER_EMAIL."
        );
      }

      const results = await Promise.all(emailJobs);
      for (const result of results) {
        if (!result.success) {
          console.error("[newsletter:email]", result.error);
        }
      }
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
