"use client";
import { useActionState } from "react";
import { savePolicyPage } from "@/app/actions/admin/cms";
import { Input, Textarea, Checkbox } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";
import { initialActionState, type ActionState } from "@/lib/validation/common";

type Policy = { id: string; slug: string; title: string; content: string; isPlaceholder: boolean; seoTitle: string | null; seoDescription: string | null };

export function PolicyForm({ policy }: { policy: Policy }) {
  const [state, formAction] = useActionState<ActionState, FormData>(savePolicyPage.bind(null, policy.id), initialActionState);
  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-beige-300 bg-white p-5">
      <input type="hidden" name="slug" value={policy.slug} />
      <Input label="Page title" name="title" required maxLength={150} defaultValue={policy.title} error={state.fieldErrors?.title} />
      <Textarea label="Content (Markdown)" name="content" required rows={16} maxLength={20000} defaultValue={policy.content} error={state.fieldErrors?.content} />
      <Checkbox
        label="This is placeholder content — show a review notice on the storefront until reviewed by a legal professional"
        name="isPlaceholder"
        defaultChecked={policy.isPlaceholder}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="SEO title" name="seoTitle" maxLength={120} defaultValue={policy.seoTitle ?? ""} />
        <Input label="SEO description" name="seoDescription" maxLength={300} defaultValue={policy.seoDescription ?? ""} />
      </div>
      <FormMessage ok={state.ok} message={state.message} />
      <SubmitButton pendingText="Saving…">Save policy page</SubmitButton>
    </form>
  );
}
