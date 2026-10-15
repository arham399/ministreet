import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { can } from "@/lib/auth/permissions";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { user } from "@/lib/db/drizzle/schema";
import { saveStoreSettings } from "@/lib/settings/store-settings";

const storeSettingsSchema = z.object({
  freeShippingThreshold: z.number().finite().min(1).max(1_000_000_000),
  defaultShippingCost: z.number().finite().min(0).max(1_000_000_000),
  announcementText: z.string().trim().min(1).max(120),
});

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { db } = getDrizzleClient();
    const [account] = await db
      .select({ id: user.id, role: user.role, isActive: user.isActive })
      .from(user)
      .where(and(eq(user.id, session.user.id), eq(user.isActive, true)))
      .limit(1);
    if (!account || !can(account.role, "settings:write")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = storeSettingsSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid store settings." },
        { status: 400 },
      );
    }

    await saveStoreSettings(parsed.data, account.id);
    revalidatePath("/", "layout");
    revalidatePath("/shipping-policy");
    revalidatePath("/terms");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/admin/settings]", error);
    return NextResponse.json(
      { error: "Unable to save store settings. Please try again." },
      { status: 500 },
    );
  }
}
