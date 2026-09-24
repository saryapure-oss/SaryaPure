import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PolicyForm } from "@/components/admin/policy-form";

export const metadata = { title: "Edit policy page" };

export default async function EditPolicyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const policy = await db.policyPage.findUnique({ where: { id } });
  if (!policy) notFound();
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-serif text-2xl font-semibold text-forest-900">{policy.title}</h1>
      <PolicyForm policy={policy} />
    </div>
  );
}
