import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { contactMessage } from "@/lib/db/drizzle/schema";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  orderNumber: z.string().max(50).optional().nullable(),
  subject: z.string().min(2).max(200),
  message: z.string().min(10).max(2000),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }
    const { db } = getDrizzleClient();
    await db.insert(contactMessage).values({
      id: globalThis.crypto.randomUUID(),
      ...parsed.data,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
