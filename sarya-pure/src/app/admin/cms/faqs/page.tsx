import { db } from "@/lib/db";
import { CmsFaqRow, CmsFaqNewForm } from "@/components/admin/cms-faq-panel";

export const metadata = { title: "FAQs" };

export default async function AdminFaqsPage() {
  const faqs = await db.fAQ.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-900">FAQs</h1>
        <p className="mt-1 text-sm text-muted">{faqs.length} question(s).</p>
      </div>
      <CmsFaqNewForm />
      <div className="space-y-3">
        {faqs.map((f) => (
          <CmsFaqRow key={f.id} faq={f} />
        ))}
      </div>
    </div>
  );
}
