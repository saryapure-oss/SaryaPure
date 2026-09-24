import { NextResponse, type NextRequest } from "next/server";
import { releaseExpiredOrders } from "@/lib/services/orders";

/**
 * Configure as a Vercel Cron job (e.g. every 10 minutes) hitting this URL with
 * header "Authorization: Bearer $CRON_SECRET". Releases stock reserved by unpaid
 * online orders whose reservation window has expired.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const released = await releaseExpiredOrders();
  return NextResponse.json({ ok: true, released });
}
