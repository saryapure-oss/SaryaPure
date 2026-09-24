"use client";
import { controlClass } from "@/components/ui/field";

export function AutoSubmitSelect({ id, name, defaultValue, options }: { id: string; name: string; defaultValue: string; options: { value: string; label: string }[] }) {
  return (
    <>
      <select id={id} name={name} defaultValue={defaultValue} className={`${controlClass} h-10 py-1.5 text-sm`} onChange={(e) => e.currentTarget.form?.requestSubmit()}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="text-sm underline">
          Sort
        </button>
      </noscript>
    </>
  );
}
