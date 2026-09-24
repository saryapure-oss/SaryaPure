import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/guards";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Newsletter Subscribers" };

const PAGE_SIZE = 50;

export default async function AdminNewsletterPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdminPage("leads:manage");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const where = q ? { OR: [{ email: { contains: q, mode: "insensitive" as const } }, { name: { contains: q, mode: "insensitive" as const } }] } : {};

  const [subscribers, total, activeTotal] = await Promise.all([
    db.newsletterSubscriber.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.newsletterSubscriber.count({ where }),
    db.newsletterSubscriber.count({ where: { isActive: true } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-forest-900">Newsletter Subscribers</h1>
          <p className="mt-1 text-sm text-muted">
            {total} total · {activeTotal} subscribed
          </p>
        </div>
        <Link href="/api/admin/newsletter/export" className="h-10 rounded-lg border border-forest-900 px-4 text-sm font-semibold leading-10 text-forest-900 hover:bg-beige-200">
          Export CSV
        </Link>
      </div>

      <form className="flex flex-wrap gap-3" method="get">
        <input name="q" defaultValue={q} placeholder="Search name or email…" className="h-10 w-64 rounded-lg border border-beige-400 bg-white px-3 text-sm" />
        <button type="submit" className="h-10 rounded-lg bg-forest-900 px-4 text-sm font-semibold text-cream-50">
          Search
        </button>
      </form>

      {subscribers.length === 0 ? (
        <EmptyState title="No subscribers found" text="Newsletter sign-ups from the storefront footer will appear here." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-beige-300 bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-beige-300 text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Subscribed on</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id} className="border-b border-beige-200 last:border-0">
                  <td className="px-4 py-3">{s.name || "—"}</td>
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3">{formatDate(s.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={s.isActive ? "green" : "gray"}>{s.isActive ? "Subscribed" : "Unsubscribed"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pages={pages} basePath="/admin/newsletter" params={{ q }} />
    </div>
  );
}
