import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { can } from "@/lib/auth/permissions";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { newsletterSubscriber } from "@/lib/db/drizzle/schema";
import { newsletterCampaignEmailHtml, sendEmail } from "@/lib/email/client";
import { SITE_URL } from "@/lib/constants";

const updateSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean(),
});
const campaignSchema = z.object({
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(5000),
  buttonText: z.string().trim().min(2).max(40).optional(),
  buttonUrl: z.string().trim().max(2048).optional(),
}).superRefine((campaign, ctx) => {
  if (Boolean(campaign.buttonText) !== Boolean(campaign.buttonUrl)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Provide both button text and a button link, or leave both blank",
      path: ["buttonUrl"],
    });
  }
  if (!campaign.buttonUrl) return;

  const value = campaign.buttonUrl;
  if (value.startsWith("/") && !value.startsWith("//")) {
    if (value.includes("\\") || /[\u0000-\u001f]/.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use a valid site path",
        path: ["buttonUrl"],
      });
    }
    return;
  }

  try {
    const url = new URL(value);
    const siteOrigin = new URL(SITE_URL).origin;
    if (
      (url.protocol !== "https:" && url.origin !== siteOrigin) ||
      url.username ||
      url.password
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use a site path or secure https URL",
        path: ["buttonUrl"],
      });
    }
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Use a site path or secure https URL",
      path: ["buttonUrl"],
    });
  }
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "newsletter:manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "A valid newsletter subject and message are required" }, { status: 400 });
  }

  const parsed = campaignSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const error =
      fieldErrors.buttonUrl?.[0] ||
      fieldErrors.buttonText?.[0] ||
      fieldErrors.subject?.[0] ||
      fieldErrors.message?.[0] ||
      parsed.error.issues[0]?.message ||
      "Check the newsletter details and try again";
    return NextResponse.json({ error, fieldErrors }, { status: 400 });
  }

  const { db } = getDrizzleClient();
  const subscribers = await db.select({ email: newsletterSubscriber.email })
    .from(newsletterSubscriber)
    .where(eq(newsletterSubscriber.isActive, true))
    .orderBy(asc(newsletterSubscriber.createdAt));
  if (subscribers.length === 0) {
    return NextResponse.json({ error: "There are no active subscribers to email" }, { status: 400 });
  }

  let campaignButtonUrl = parsed.data.buttonUrl || undefined;
  if (campaignButtonUrl && !campaignButtonUrl.startsWith("/")) {
    const url = new URL(campaignButtonUrl);
    if (url.origin === new URL(SITE_URL).origin) {
      campaignButtonUrl = `${url.pathname}${url.search}${url.hash}`;
    }
  }

  let sent = 0;
  const failedRecipients: string[] = [];
  for (let offset = 0; offset < subscribers.length; offset += 5) {
    const batch = subscribers.slice(offset, offset + 5);
    const results = await Promise.all(
      batch.map(async ({ email }) => {
        const result = await sendEmail({
          to: email,
          subject: parsed.data.subject,
          html: newsletterCampaignEmailHtml({
            subject: parsed.data.subject,
            message: parsed.data.message,
            buttonText: parsed.data.buttonText || undefined,
            buttonUrl: campaignButtonUrl,
            email,
          }),
          template: "newsletter-campaign",
        });
        return { email, success: result.success };
      })
    );

    for (const result of results) {
      if (result.success) sent += 1;
      else failedRecipients.push(result.email);
    }
  }

  if (failedRecipients.length > 0) {
    return NextResponse.json(
      {
        success: false,
        sent,
        failed: failedRecipients.length,
        total: subscribers.length,
        error: "Some newsletter emails could not be sent. Check Admin → Email log.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, sent, failed: 0, total: subscribers.length });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "newsletter:manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Subscriber id and active status are required" }, { status: 400 });
  }

  const [subscriber] = await getDrizzleClient().db.update(newsletterSubscriber)
    .set({ isActive: parsed.data.isActive })
    .where(eq(newsletterSubscriber.id, parsed.data.id))
    .returning({ id: newsletterSubscriber.id, isActive: newsletterSubscriber.isActive });
  if (!subscriber) return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });

  return NextResponse.json({ success: true, subscriber });
}
