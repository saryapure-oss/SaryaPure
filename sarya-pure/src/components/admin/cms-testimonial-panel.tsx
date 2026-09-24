"use client";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveTestimonial, deleteTestimonial } from "@/app/actions/admin/cms";
import { Input, Textarea, Checkbox } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";
import { Badge } from "@/components/ui/badge";
import { initialActionState, type ActionState } from "@/lib/validation/common";
import { useToast } from "@/components/store/toast";

type Testimonial = { id: string; name: string; location: string | null; content: string; rating: number; isDemo: boolean; isPublished: boolean; sortOrder: number };

function Fields({ t, state }: { t?: Testimonial; state: ActionState }) {
  const p = t ? `testimonial-${t.id}` : "new-testimonial";
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Name" name="name" id={`${p}-name`} required maxLength={80} defaultValue={t?.name} error={state.fieldErrors?.name} />
        <Input label="Location (optional)" name="location" id={`${p}-location`} maxLength={80} defaultValue={t?.location ?? ""} />
      </div>
      <Textarea label="Testimonial" name="content" id={`${p}-content`} required maxLength={600} defaultValue={t?.content} error={state.fieldErrors?.content} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Rating (1-5)" name="rating" id={`${p}-rating`} type="number" min={1} max={5} defaultValue={t?.rating ?? 5} />
        <Input label="Sort order" name="sortOrder" id={`${p}-sortOrder`} type="number" defaultValue={t?.sortOrder ?? 0} />
      </div>
      <div className="flex gap-4">
        <Checkbox label="Demo / placeholder content" name="isDemo" defaultChecked={t?.isDemo ?? true} />
        <Checkbox label="Published" name="isPublished" defaultChecked={t?.isPublished ?? false} />
      </div>
    </>
  );
}

export function CmsTestimonialNewForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(saveTestimonial.bind(null, null), initialActionState);
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold text-forest-800 hover:underline">
        + Add testimonial
      </button>
    );
  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-dashed border-beige-400 bg-white p-4">
      <Fields state={state} />
      <FormMessage ok={state.ok} message={state.message} />
      <SubmitButton size="sm" pendingText="Adding…">
        Add
      </SubmitButton>
    </form>
  );
}

export function CmsTestimonialRow({ testimonial }: { testimonial: Testimonial }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(saveTestimonial.bind(null, testimonial.id), initialActionState);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  if (!editing) {
    return (
      <div className="rounded-xl border border-beige-300 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium">
              {testimonial.name} {testimonial.location && <span className="font-normal text-muted">· {testimonial.location}</span>}
            </p>
            <p className="mt-1 text-sm text-muted">&ldquo;{testimonial.content}&rdquo;</p>
          </div>
          <div className="flex shrink-0 gap-2">
            {testimonial.isDemo && <Badge tone="gray">Demo</Badge>}
            <Badge tone={testimonial.isPublished ? "green" : "gray"}>{testimonial.isPublished ? "Published" : "Draft"}</Badge>
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
              if (!window.confirm("Delete this testimonial?")) return;
              start(async () => {
                const res = await deleteTestimonial(testimonial.id);
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
      <Fields t={testimonial} state={state} />
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
