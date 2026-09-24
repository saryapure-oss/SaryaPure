import { db } from "@/lib/db";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { formatINR } from "@/lib/money";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Customers" };

const PAGE_SIZE = 25;

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const where = {
    role: "CUSTOMER" as const,
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }, { phone: { contains: q } }] } : {}),
  };

  const [customers, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, name: true, email: true, phone: true, createdAt: true, orders: { select: { total: true, paymentStatus: true } } },
    }),
    db.user.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-900">Customers</h1>
        <p className="mt-1 text-sm text-muted">{total} registered customer(s).</p>
      </div>

      <form className="flex flex-wrap gap-3" method="get">
        <input name="q" defaultValue={q} placeholder="Search name, email, phone…" className="h-10 w-72 rounded-lg border border-beige-400 bg-white px-3 text-sm" />
        <button type="submit" className="h-10 rounded-lg bg-forest-900 px-4 text-sm font-semibold text-cream-50">
          Search
        </button>
      </form>

      {customers.length === 0 ? (
        <EmptyState title="No customers found" text="Try a different search." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-beige-300 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-beige-300 text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Total spent</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const paid = c.orders.filter((o) => o.paymentStatus === "PAID");
                const spent = paid.reduce((s, o) => s + o.total, 0);
                return (
                  <tr key={c.id} className="border-b border-beige-200 last:border-0">
                    <td className="px-4 py-3">{c.name}</td>
                    <td className="px-4 py-3 text-muted">{c.email}</td>
                    <td className="px-4 py-3 text-muted">{c.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{formatDate(c.createdAt.toISOString())}</td>
                    <td className="px-4 py-3">{c.orders.length}</td>
                    <td className="px-4 py-3">{formatINR(spent)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pages={pages} basePath="/admin/customers" params={{ q }} />
    </div>
  );
}
