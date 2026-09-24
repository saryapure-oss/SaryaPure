import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/guards";

function csvEscape(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export async function GET() {
  // notFound()s for non-admins, same guard used by the page — never expose subscriber emails to anyone else.
  await requireAdminPage("leads:manage");

  const subscribers = await db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } });
  const rows = [
    ["Name", "Email", "Status", "Subscribed on"],
    ...subscribers.map((s) => [s.name ?? "", s.email, s.isActive ? "Subscribed" : "Unsubscribed", s.createdAt.toISOString()]),
  ];
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
