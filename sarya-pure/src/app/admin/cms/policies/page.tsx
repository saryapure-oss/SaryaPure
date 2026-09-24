import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Legal & Policy Pages" };

export default async function AdminPoliciesPage() {
  const policies = await db.policyPage.findMany({ orderBy: { title: "asc" } });
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-900">Legal &amp; Policy Pages</h1>
        <p className="mt-1 text-sm text-muted">
          Pages marked <Badge tone="gold">Placeholder</Badge> show a visible notice on the storefront until a legal professional reviews and you uncheck it here.
        </p>
      </div>
      <div className="space-y-2">
        {policies.map((p) => (
          <Link key={p.id} href={`/admin/cms/policies/${p.id}`} className="flex items-center justify-between rounded-xl border border-beige-300 bg-white px-4 py-3 hover:bg-beige-100">
            <span className="font-medium">{p.title}</span>
            {p.isPlaceholder && <Badge tone="gold">Placeholder</Badge>}
          </Link>
        ))}
      </div>
    </div>
  );
}
