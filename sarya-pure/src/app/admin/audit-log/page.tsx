import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/guards";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";

export const metadata = { title: "Audit Log" };

const PAGE_SIZE = 50;

export default async function AdminAuditLogPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdminPage("audit:view");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { name: true, email: true } } },
    }),
    db.auditLog.count(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-900">Audit Log</h1>
        <p className="mt-1 text-sm text-muted">A record of sensitive admin actions — status changes, refunds, publishing, settings updates.</p>
      </div>

      {logs.length === 0 ? (
        <EmptyState title="No activity recorded yet" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-beige-300 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-beige-300 text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-beige-200 last:border-0">
                  <td className="px-4 py-3 text-muted">{formatDate(l.createdAt.toISOString(), true)}</td>
                  <td className="px-4 py-3">{l.actor?.name ?? "System"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{l.action}</td>
                  <td className="px-4 py-3 text-muted">
                    {l.entity} {l.entityId && <span className="font-mono text-xs">#{l.entityId.slice(0, 8)}</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{l.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pages={pages} basePath="/admin/audit-log" params={{}} />
    </div>
  );
}
