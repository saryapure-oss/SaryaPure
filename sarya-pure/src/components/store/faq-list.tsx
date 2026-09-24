import { ChevronDown } from "lucide-react";
import { JsonLd } from "@/components/ui/json-ld";

export function FaqList({ faqs, withSchema = false }: { faqs: { id: string; question: string; answer: string }[]; withSchema?: boolean }) {
  return (
    <>
      <div className="divide-y divide-beige-300 rounded-2xl border border-beige-300 bg-cream-50">
        {faqs.map((f) => (
          <details key={f.id} className="group px-5 py-1 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-semibold text-ink">
              {f.question}
              <ChevronDown className="h-5 w-5 shrink-0 text-forest-700 transition group-open:rotate-180" aria-hidden />
            </summary>
            <p className="pb-5 leading-7 text-muted whitespace-pre-line">{f.answer}</p>
          </details>
        ))}
      </div>
      {withSchema && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
          }}
        />
      )}
    </>
  );
}
