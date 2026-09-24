import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { FaqList } from "@/components/store/faq-list";
import { EmptyState } from "@/components/ui/empty-state";
import { JsonLd } from "@/components/ui/json-ld";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Answers to common questions about ordering, shipping, payments and our dry fruit products.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const faqs = await db.fAQ.findMany({ where: { isPublished: true }, orderBy: [{ category: "asc" }, { sortOrder: "asc" }] });

  if (faqs.length === 0) {
    return (
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: "FAQ" }]} />
        <h1 className="mt-4 text-4xl sm:text-5xl">Frequently Asked Questions</h1>
        <div className="mt-8">
          <EmptyState title="No FAQs published yet" text="Please check back soon, or contact us if you have a question." />
        </div>
      </div>
    );
  }

  const categories = Array.from(new Set(faqs.map((f) => f.category)));

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "FAQ" }]} />
      <h1 className="mt-4 text-4xl sm:text-5xl">Frequently Asked Questions</h1>
      <p className="mt-2 max-w-2xl text-muted">Can&apos;t find what you&apos;re looking for? Feel free to contact us.</p>

      <div className="mt-8 space-y-10">
        {categories.map((cat) => (
          <div key={cat}>
            <h2 className="text-2xl">{cat}</h2>
            <div className="mt-4">
              <FaqList faqs={faqs.filter((f) => f.category === cat)} />
            </div>
          </div>
        ))}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
        }}
      />
    </div>
  );
}
