import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ANALYTICS_EVENTS, track } from "@/lib/services/analytics";
import { isSameOrigin } from "@/lib/security/request";
import { rateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";

const schema = z.object({
  type: z.enum(ANALYTICS_EVENTS),
  productId: z.string().max(64).optional(),
  meta: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ ok: false }, { status: 403 });
  if (!(await rateLimit(`analytics:${await getClientIp()}`, 120, 60))) return NextResponse.json({ ok: false }, { status: 429 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  await track(parsed.data.type, { productId: parsed.data.productId, meta: parsed.data.meta });
  return NextResponse.json({ ok: true });
}
