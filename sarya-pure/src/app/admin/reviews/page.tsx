import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Stars } from "@/components/ui/stars";
import { formatDate } from "@/lib/utils";
import { ReviewActions } from "@/components/admin/review-actions";

export const metadata = { title: "Reviews" };

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const status = sp.status ?? "PENDING";

  const reviews = await db.review.findMany({
    where: status === "ALL" ? {} : { status: status as "PENDING" | "APPROVED" | "REJECTED" },
    include: { product: { select: { name: true, slug: true } }, user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-900">Reviews</h1>
        <p className="mt-1 text-sm text-muted">Moderate customer reviews. Only verified purchasers can submit reviews.</p>
      </div>

      <div className="flex gap-2">
        {["PENDING", "APPROVED", "REJECTED", "ALL"].map((s) => (
          <a key={s} href={`/admin/reviews?status=${s}`} className={`rounded-full px-4 py-1.5 text-sm font-medium ${status === s ? "bg-forest-900 text-cream-50" : "bg-beige-200"}`}>
            {s}
          </a>
        ))}
      </div>

      {reviews.length === 0 ? (
        <EmptyState title="No reviews here" />
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-beige-300 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{r.product.name}</p>
                  <p className="text-xs text-muted">
                    {r.user.name} · {r.user.email} · {formatDate(r.createdAt.toISOString(), true)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Stars rating={r.rating} />
                  <Badge tone={r.status === "APPROVED" ? "green" : r.status === "REJECTED" ? "red" : "gold"}>{r.status}</Badge>
                  {r.isFeatured && <Badge tone="blue">Featured</Badge>}
                </div>
              </div>
              {r.title && <p className="mt-2 font-medium">{r.title}</p>}
              <p className="mt-1 text-sm text-ink">{r.body}</p>
              <ReviewActions reviewId={r.id} status={r.status} isFeatured={r.isFeatured} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
