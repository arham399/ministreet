import { eq, inArray } from "drizzle-orm";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  DEFAULT_SHIPPING_COST,
  FREE_SHIPPING_THRESHOLD,
  SITE_TAGLINE,
} from "@/lib/constants";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { auditLog, siteSetting } from "@/lib/db/drizzle/schema";

export type StoreSettings = {
  freeShippingThreshold: number;
  defaultShippingCost: number;
  announcementText: string;
  storeEmail: string;
  storePhone: string;
};

const settingDefaults: Record<string, string> = {
  free_shipping_threshold: String(FREE_SHIPPING_THRESHOLD),
  default_shipping_cost: String(DEFAULT_SHIPPING_COST),
  announcement_text: SITE_TAGLINE,
  store_email: CONTACT_EMAIL,
  store_phone: CONTACT_PHONE,
};

export async function getStoreSettings(): Promise<StoreSettings> {
  const keys = Object.keys(settingDefaults);
  const { db } = getDrizzleClient();
  const rows = await db
    .select({ key: siteSetting.key, value: siteSetting.value })
    .from(siteSetting)
    .where(inArray(siteSetting.key, keys));
  const values = new Map(rows.map(({ key, value }) => [key, value]));
  const getValue = (key: string) => {
    const value = values.get(key)?.trim();
    return value && !["STORE_EMAIL", "STORE_PHONE"].includes(value)
      ? value
      : settingDefaults[key];
  };
  const parseAmount = (key: string) => {
    const value = Number(getValue(key));
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`Invalid store setting: ${key}.`);
    }
    return value;
  };

  return {
    freeShippingThreshold: parseAmount("free_shipping_threshold"),
    defaultShippingCost: parseAmount("default_shipping_cost"),
    announcementText: getValue("announcement_text"),
    storeEmail: getValue("store_email"),
    storePhone: getValue("store_phone"),
  };
}

export async function saveStoreSettings(settings: {
  freeShippingThreshold: number;
  defaultShippingCost: number;
  announcementText: string;
}, actorId: string) {
  const { db } = getDrizzleClient();
  const now = new Date();
  await db.transaction(async (tx) => {
    for (const [key, value] of [
      ["free_shipping_threshold", settings.freeShippingThreshold],
      ["default_shipping_cost", settings.defaultShippingCost],
      ["announcement_text", settings.announcementText],
    ] as const) {
      await tx
        .insert(siteSetting)
        .values({ key, value: String(value), updatedAt: now })
        .onConflictDoUpdate({
          target: siteSetting.key,
          set: { value: String(value), updatedAt: now },
        });
    }
    await tx.insert(auditLog).values({
      actorId,
      action: "STORE_SETTINGS_UPDATED",
      entityType: "SiteSetting",
      metadata: {
        freeShippingThreshold: settings.freeShippingThreshold,
        defaultShippingCost: settings.defaultShippingCost,
        announcementText: settings.announcementText,
      },
    });
  });
}
