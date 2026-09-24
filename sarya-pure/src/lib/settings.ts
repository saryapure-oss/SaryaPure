import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { parseSetting, SETTINGS_KEYS, type Settings, type SettingsKey } from "@/lib/settings-schema";

/** Loads all settings once per request, merged over safe defaults. */
export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await db.siteSetting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const out = {} as Record<SettingsKey, unknown>;
  for (const key of SETTINGS_KEYS) out[key] = parseSetting(key, map.get(key));
  return out as Settings;
});

export async function getSetting<K extends SettingsKey>(key: K): Promise<Settings[K]> {
  return (await getSettings())[key];
}

/** Admin-only write path. Validates against the section's schema before persisting. */
export async function updateSetting<K extends SettingsKey>(key: K, value: unknown): Promise<Settings[K]> {
  const parsed = parseSetting(key, value);
  await db.siteSetting.upsert({
    where: { key },
    create: { key, value: parsed as object },
    update: { value: parsed as object },
  });
  return parsed;
}

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}
