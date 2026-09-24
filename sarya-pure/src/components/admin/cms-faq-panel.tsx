"use client";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveFaq, deleteFaq } from "@/app/actions/admin/cms";
import { Input, Textarea, Checkbox } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";
import { Badge } from "@/components/ui/badge";
import { initialActionState, type ActionState } from "@/lib/validation/common";
import { useToast } from "@/components/store/toast";

type Faq = { id: string; question: string; answer: string; category: string; sortOrder: number; isPublished: boolean; showOnHome: boolean };

export function CmsFaqNewForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(saveFaq.bind(null, null), initialActionState);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold text-forest-800 hover:underline">
        + Add FAQ
      </button>
    );
  }
  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-dashed border-beige-400 bg-white p-4">
      <Input label="Question" name="question" id="new-faq-question" required maxLength={300} error={state.fieldErrors?.question} />
      <Textarea label="Answer" name="answer" id="new-faq-answer" required maxLength={2000} error={state.fieldErrors?.answer} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Category" name="category" id="new-faq-category" maxLength={60} placeholder="General" />
        <Input label="Sort order" name="sortOrder" id="new-faq-sortOrder" type="number" defaultValue={0} />
      </div>
      <div className="flex gap-4">
        <Checkbox label="Published" name="isPublished" defaultChecked />
        <Checkbox label="Show on homepage" name="showOnHome" />
      </div>
      <FormMessage ok={state.ok} message={state.message} />
      <SubmitButton size="sm" pendingText="Adding…">
        Add
      </SubmitButton>
    </form>
  );
}

export function CmsFaqRow({ faq }: { faq: Faq }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(saveFaq.bind(null, faq.id), initialActionState);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  if (!editing) {
    return (
      <div className="rounded-xl border border-beige-300 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium">{faq.question}</p>
            <p className="mt-1 text-sm text-muted">{faq.answer}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Badge tone={faq.isPublished ? "green" : "gray"}>{faq.isPublished ? "Published" : "Draft"}</Badge>
            {faq.showOnHome && <Badge tone="blue">Homepage</Badge>}
          </div>
        </div>
        <div className="mt-3 flex gap-3 text-sm font-medium">
          <button type="button" onClick={() => setEditing(true)} className="text-forest-800 hover:underline">
            Edit
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!window.confirm("Delete this FAQ?")) return;
              start(async () => {
                const res = await deleteFaq(faq.id);
                toast(res.message, res.ok ? "success" : "error");
                router.refresh();
              });
            }}
            className="text-red-700 hover:underline disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-beige-300 bg-beige-50 p-4">
      <Input label="Question" name="question" id={`faq-${faq.id}-question`} required maxLength={300} defaultValue={faq.question} error={state.fieldErrors?.question} />
      <Textarea label="Answer" name="answer" id={`faq-${faq.id}-answer`} required maxLength={2000} defaultValue={faq.answer} error={state.fieldErrors?.answer} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Category" name="category" id={`faq-${faq.id}-category`} maxLength={60} defaultValue={faq.category} />
        <Input label="Sort order" name="sortOrder" id={`faq-${faq.id}-sortOrder`} type="number" defaultValue={faq.sortOrder} />
      </div>
      <div className="flex gap-4">
        <Checkbox label="Published" name="isPublished" defaultChecked={faq.isPublished} />
        <Checkbox label="Show on homepage" name="showOnHome" defaultChecked={faq.showOnHome} />
      </div>
      <FormMessage ok={state.ok} message={state.message} />
      <div className="flex gap-3">
        <SubmitButton size="sm" pendingText="Saving…">
          Save
        </SubmitButton>
        <button type="button" onClick={() => setEditing(false)} className="text-sm font-medium text-muted hover:underline">
          Cancel
        </button>
      </div>
    </form>
  );
}
