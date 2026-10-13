import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { user } from "@/lib/db/drizzle/schema";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  phone: z.string().max(20).optional().nullable(),
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
    const [existing] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const [createdUser] = await db
      .insert(user)
      .values({
        id: globalThis.crypto.randomUUID(),
        email,
        name: parsed.data.name,
        phone: parsed.data.phone,
        passwordHash,
        role: "CUSTOMER",
        updatedAt: new Date(),
      })
      .returning({ id: user.id, email: user.email, name: user.name });
    return NextResponse.json({
      success: true,
      user: createdUser,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
