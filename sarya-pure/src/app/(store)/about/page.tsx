import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Markdown } from "@/components/ui/markdown";
import { SmartImage } from "@/components/ui/smart-image";

export async function generateMetadata(): Promise<Metadata> {
  const { about } = await getSettings();
  return {
    title: about.title,
    description: about.intro,
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const { about, business } = await getSettings();
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "About" }]} />
      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="eyebrow">{business.brandName || "About us"}</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">{about.title}</h1>
          {about.intro && <p className="mt-4 text-lg text-muted">{about.intro}</p>}
          <div className="mt-6">
            <Markdown>{about.body}</Markdown>
          </div>
        </div>
        {about.image && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-cream-200">
            <SmartImage src={about.image} alt={about.title} fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
          </div>
        )}
      </div>
    </div>
  );
}
