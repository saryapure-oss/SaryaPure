import type { Metadata } from "next";
import { Building2, Boxes, HandCoins, Handshake } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { B2BForm } from "@/components/store/b2b-form";

export const metadata: Metadata = {
  title: "B2B & Bulk Orders",
  description: "Bulk dry fruit supply for retailers, wholesalers, distributors, hotels, restaurants, cafés and corporate gifting.",
  alternates: { canonical: "/b2b" },
};

const POINTS = [
  { icon: Boxes, title: "Bulk quantities", text: "Flexible order sizes for retailers, wholesalers and distributors." },
  { icon: Building2, title: "Corporate gifting", text: "Curated hampers for festivals, employee gifting and events." },
  { icon: HandCoins, title: "Competitive pricing", text: "Volume-based pricing tailored to your business needs." },
  { icon: Handshake, title: "Dedicated support", text: "A single point of contact to help with recurring orders." },
];

export default async function B2BPage() {
  const { home } = await getSettings();
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "B2B & Bulk Orders" }]} />
      <h1 className="mt-4 text-4xl sm:text-5xl">{home.b2bHeadline}</h1>
      <p className="mt-2 max-w-2xl text-muted">{home.b2bText}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {POINTS.map((p) => (
          <div key={p.title} className="rounded-2xl border border-beige-300 bg-cream-50 p-5">
            <p.icon className="h-6 w-6 text-forest-700" aria-hidden />
            <p className="mt-3 font-semibold text-ink">{p.title}</p>
            <p className="mt-1 text-sm text-muted">{p.text}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-2xl card p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-ink">Tell us what you need</h2>
        <p className="mt-1 text-sm text-muted">Fill in your requirements and our team will get back to you with a quote.</p>
        <div className="mt-5">
          <B2BForm />
        </div>
      </div>
    </div>
  );
}
