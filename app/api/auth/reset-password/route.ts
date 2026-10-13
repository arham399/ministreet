import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { user, verificationToken } from "@/lib/db/drizzle/schema";

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(10),
  password: z.string().min(8).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }
    const email = parsed.data.email.toLowerCase();
    const { db } = getDrizzleClient();
    const [record] = await db
      .select({ expires: verificationToken.expires })
      .from(verificationToken)
      .where(and(
        eq(verificationToken.identifier, `reset:${email}`),
        eq(verificationToken.token, parsed.data.token),
      ))
      .limit(1);
    if (!record || new Date(record.expires) < new Date()) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await db
      .update(user)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(user.email, email));
    await db
      .delete(verificationToken)
      .where(eq(verificationToken.identifier, `reset:${email}`));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
