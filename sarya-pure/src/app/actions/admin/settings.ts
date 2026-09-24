"use server";
import { revalidatePath } from "next/cache";
import { updateSetting } from "@/lib/settings";
import { assertPermission } from "@/lib/auth/guards";
import { audit } from "@/lib/services/audit";
import { formToObject, type ActionState } from "@/lib/validation/common";
import type { SettingsKey } from "@/lib/settings-schema";

const KEY_PERMISSION: Record<SettingsKey, "settings:manage" | "cms:manage"> = {
  business: "settings:manage",
  legal: "settings:manage",
  commerce: "settings:manage",
  payment: "settings:manage",
  social: "settings:manage",
  seo: "settings:manage",
  announcement: "cms:manage",
  hero: "cms:manage",
  home: "cms:manage",
  about: "cms:manage",
  footer: "cms:manage",
};

/** Checkbox fields per settings section — unchecked boxes are absent from FormData, so we must explicitly default them to false. */
const BOOLEAN_FIELDS: Partial<Record<SettingsKey, string[]>> = {
  commerce: ["pricesIncludeTax", "allowAllPincodes", "codEnabled"],
  payment: ["razorpayEnabled"],
  announcement: ["enabled"],
};

/** Generic settings-section save for simple (non-array) sections. Numbers/strings pass through Zod coercion in the schema. */
export async function saveSettingsSection(key: SettingsKey, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await assertPermission(KEY_PERMISSION[key]).catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };

  const flat = formToObject(fd) as Record<string, unknown>;
  for (const field of BOOLEAN_FIELDS[key] ?? []) flat[field] = flat[field] === "on";

  // Expand dotted keys ("primaryCta.label") into nested objects for schemas with nested shapes (e.g. hero CTAs).
  const raw: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(flat)) {
    if (k.includes(".")) {
      const [parent, child] = k.split(".");
      const bucket = (raw[parent] ??= {}) as Record<string, unknown>;
      bucket[child] = v;
    } else {
      raw[k] = v;
    }
  }

  try {
    await updateSetting(key, raw);
  } catch {
    return { ok: false, message: "Could not save — please check the values entered." };
  }
  await audit({ actorId: admin.id, action: "settings.update", entity: "SiteSetting", entityId: key });
  revalidatePath("/admin/settings");
  revalidatePath("/admin/cms");
  revalidatePath("/");
  return { ok: true, message: "Saved." };
}
