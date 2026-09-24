import { db } from "@/lib/db";
import { CmsBannerRow, CmsBannerNewForm } from "@/components/admin/cms-banner-panel";

export const metadata = { title: "Banners" };

export default async function AdminBannersPage() {
  const banners = await db.banner.findMany({ orderBy: [{ placement: "asc" }, { sortOrder: "asc" }] });
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-900">Banners</h1>
        <p className="mt-1 text-sm text-muted">Promotional banners shown on the homepage and shop page.</p>
      </div>
      <CmsBannerNewForm />
      <div className="space-y-3">
        {banners.map((b) => (
          <CmsBannerRow key={b.id} banner={b} />
        ))}
      </div>
    </div>
  );
}
