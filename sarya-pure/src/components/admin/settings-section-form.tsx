"use client";
import { useActionState } from "react";
import { saveSettingsSection } from "@/app/actions/admin/settings";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";
import { initialActionState, type ActionState } from "@/lib/validation/common";
import type { SettingsKey } from "@/lib/settings-schema";

export function SettingsSectionForm({ sectionKey, title, hint, children }: { sectionKey: SettingsKey; title: string; hint?: string; children: React.ReactNode }) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveSettingsSection.bind(null, sectionKey), initialActionState);
  return (
    <section className="rounded-2xl border border-beige-300 bg-white p-5">
      <h2 className="font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      <form action={formAction} className="mt-4 space-y-4">
        {children}
        <FormMessage ok={state.ok} message={state.message} />
        <SubmitButton size="sm" pendingText="Saving…">
          Save
        </SubmitButton>
      </form>
    </section>
  );
}
