import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { B2BStatusSelect } from "@/components/admin/b2b-status-select";

export const metadata = { title: "B2B Enquiries" };

const TONE: Record<string, "gray" | "blue" | "gold" | "green" | "red"> = {
  NEW: "gold",
  CONTACTED: "blue",
  QUOTED: "blue",
  NEGOTIATION: "blue",
  CONVERTED: "green",
  CLOSED: "gray",
};

export default async function AdminB2BPage() {
  const enquiries = await db.b2BEnquiry.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-900">B2B &amp; Bulk Enquiries</h1>
        <p className="mt-1 text-sm text-muted">{enquiries.length} enquirie(s).</p>
      </div>

      {enquiries.length === 0 ? (
        <EmptyState title="No enquiries yet" />
      ) : (
        <div className="space-y-4">
          {enquiries.map((e) => (
            <div key={e.id} className="rounded-2xl border border-beige-300 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {e.name} {e.company && `· ${e.company}`}
                  </p>
                  <p className="text-xs text-muted">
                    {e.email} · {e.phone} · {e.city} · {formatDate(e.createdAt.toISOString(), true)}
                  </p>
                </div>
                <Badge tone={TONE[e.status] ?? "gray"}>{e.status}</Badge>
              </div>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted">Product requirement</dt>
                  <dd>{e.productRequirement}</dd>
                </div>
                <div>
                  <dt className="text-muted">Estimated quantity</dt>
                  <dd>{e.estimatedQuantity}</dd>
                </div>
                {e.budget && (
                  <div>
                    <dt className="text-muted">Budget</dt>
                    <dd>{e.budget}</dd>
                  </div>
                )}
                {e.businessType && (
                  <div>
                    <dt className="text-muted">Business type</dt>
                    <dd>{e.businessType}</dd>
                  </div>
                )}
              </dl>
              {e.message && <p className="mt-2 text-sm text-muted">&ldquo;{e.message}&rdquo;</p>}
              <B2BStatusSelect id={e.id} status={e.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
