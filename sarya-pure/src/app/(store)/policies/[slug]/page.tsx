import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Markdown } from "@/components/ui/markdown";
import { formatDate } from "@/lib/utils";

const VALID_SLUGS = ["shipping-policy", "return-refund-policy", "cancellation-policy", "privacy-policy", "terms-and-conditions", "cookie-policy"];

async function getPolicy(slug: string) {
  if (!VALID_SLUGS.includes(slug)) return null;
  return db.policyPage.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: PageProps<"/policies/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const policy = await getPolicy(slug);
  if (!policy) return { title: "Policy not found" };
  return {
    title: policy.seoTitle || policy.title,
    description: policy.seoDescription || undefined,
    alternates: { canonical: `/policies/${slug}` },
  };
}

export default async function PolicyPageRoute({ params }: PageProps<"/policies/[slug]">) {
  const { slug } = await params;
  const policy = await getPolicy(slug);
  if (!policy) notFound();

  return (
    <div className="container-page max-w-3xl py-8">
      <Breadcrumbs items={[{ label: "Policies", href: "/policies/shipping-policy" }, { label: policy.title }]} />
      <h1 className="mt-4 text-4xl sm:text-5xl">{policy.title}</h1>
      <p className="mt-2 text-sm text-muted">Last updated {formatDate(policy.updatedAt)}</p>

      {policy.isPlaceholder && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-gold-400/60 bg-gold-50 px-4 py-3 text-sm text-brown-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" aria-hidden />
          <p>
            This is placeholder content and has not yet been reviewed by a legal professional. It should not be relied upon until Sarya Pure Pvt Ltd publishes its final,
            reviewed policy.
          </p>
        </div>
      )}

      <div className="mt-8">
        <Markdown>{policy.content}</Markdown>
      </div>
    </div>
  );
}
