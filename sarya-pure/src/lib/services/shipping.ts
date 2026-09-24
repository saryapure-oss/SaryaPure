import "server-only";
import { db } from "@/lib/db";
import type { Settings } from "@/lib/settings-schema";

export type ShippingQuote = {
  serviceable: boolean;
  rate: number;
  freeAbove: number | null;
  etaMinDays: number;
  etaMaxDays: number;
  codAvailable: boolean;
  zoneName: string | null;
};

/** Resolve shipping for a PIN code using the most specific (longest prefix) active zone, else the defaults. */
export async function quoteShipping(pincode: string | null | undefined, commerce: Settings["commerce"]): Promise<ShippingQuote> {
  const fallback: ShippingQuote = {
    serviceable: commerce.allowAllPincodes || !pincode,
    rate: commerce.flatShippingRate,
    freeAbove: commerce.freeShippingThreshold > 0 ? commerce.freeShippingThreshold : null,
    etaMinDays: commerce.defaultEtaMinDays,
    etaMaxDays: commerce.defaultEtaMaxDays,
    codAvailable: commerce.codEnabled,
    zoneName: null,
  };
  if (!pincode) return fallback;

  const zones = await db.shippingZone.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  let best: (typeof zones)[number] | null = null;
  let bestLen = 0;
  for (const z of zones) {
    for (const prefix of z.pincodePrefixes) {
      if (prefix && pincode.startsWith(prefix) && prefix.length > bestLen) {
        best = z;
        bestLen = prefix.length;
      }
    }
  }
  if (!best) return fallback;
  return {
    serviceable: true,
    rate: best.rate,
    freeAbove: best.freeAbove,
    etaMinDays: best.etaMinDays,
    etaMaxDays: best.etaMaxDays,
    codAvailable: commerce.codEnabled && best.codAvailable,
    zoneName: best.name,
  };
}
