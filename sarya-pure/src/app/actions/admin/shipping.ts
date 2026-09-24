"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertPermission } from "@/lib/auth/guards";
import { text, formToObject, zodFieldErrors, type ActionState } from "@/lib/validation/common";
import { audit } from "@/lib/services/audit";

const zoneSchema = z.object({
  name: text(80),
  pincodePrefixes: text(500),
  rate: z.coerce.number().int().min(0),
  freeAbove: z.coerce.number().int().min(0).optional(),
  etaMinDays: z.coerce.number().int().min(0).default(3),
  etaMaxDays: z.coerce.number().int().min(0).default(7),
  codAvailable: z.union([z.literal("on"), z.literal("")]).optional(),
  isActive: z.union([z.literal("on"), z.literal("")]).optional(),
  sortOrder: z.coerce.number().int().default(0),
});

function toPrefixes(v: string): string[] {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 200);
}

export async function saveShippingZone(id: string | null, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await assertPermission("shipping:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const parsed = zoneSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };

  const data = {
    name: parsed.data.name,
    pincodePrefixes: toPrefixes(parsed.data.pincodePrefixes),
    rate: parsed.data.rate,
    freeAbove: parsed.data.freeAbove ?? null,
    etaMinDays: parsed.data.etaMinDays,
    etaMaxDays: parsed.data.etaMaxDays,
    codAvailable: parsed.data.codAvailable === "on",
    isActive: parsed.data.isActive === "on",
    sortOrder: parsed.data.sortOrder,
  };
  if (id) await db.shippingZone.update({ where: { id }, data });
  else await db.shippingZone.create({ data });
  await audit({ actorId: admin.id, action: id ? "shipping.update" : "shipping.create", entity: "ShippingZone", entityId: id ?? undefined });
  revalidatePath("/admin/shipping");
  return { ok: true, message: "Saved." };
}

export async function deleteShippingZone(id: string): Promise<{ ok: boolean; message: string }> {
  const admin = await assertPermission("shipping:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  await db.shippingZone.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/shipping");
  return { ok: true, message: "Deleted." };
}
