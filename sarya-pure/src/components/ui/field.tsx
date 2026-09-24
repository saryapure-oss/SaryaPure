import { cn } from "@/lib/utils";

const control =
  "block w-full rounded-lg border border-beige-400 bg-white px-3.5 py-2.5 text-base text-ink placeholder:text-muted/70 shadow-sm transition focus:border-forest-700 focus:outline-none focus:ring-2 focus:ring-forest-700/20 disabled:bg-cream-200 aria-[invalid=true]:border-red-600";

type Common = { label: string; name: string; id?: string; error?: string; hint?: string; className?: string; required?: boolean };

function Wrapper({ label, id, error, hint, className, required, children }: Common & { children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-red-700" aria-hidden> *</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function aria(id: string, error?: string, hint?: string) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  } as const;
}

/** Every field's DOM id defaults to its form `name`, but callers can pass a distinct `id` — required whenever two fields with the same `name` (e.g. a product form and a nested variant form) render on the same page, to avoid invalid duplicate ids breaking label association. */
export function Input({ label, name, id, error, hint, className, required, ...props }: Common & React.InputHTMLAttributes<HTMLInputElement>) {
  const fieldId = id ?? name;
  return (
    <Wrapper {...{ label, name, id: fieldId, error, hint, className, required }}>
      <input id={fieldId} name={name} required={required} className={control} {...aria(fieldId, error, hint)} {...props} />
    </Wrapper>
  );
}

export function Textarea({ label, name, id, error, hint, className, required, ...props }: Common & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const fieldId = id ?? name;
  return (
    <Wrapper {...{ label, name, id: fieldId, error, hint, className, required }}>
      <textarea id={fieldId} name={name} required={required} rows={4} className={control} {...aria(fieldId, error, hint)} {...props} />
    </Wrapper>
  );
}

export function Select({
  label,
  name,
  id,
  error,
  hint,
  className,
  required,
  options,
  placeholder,
  ...props
}: Common & React.SelectHTMLAttributes<HTMLSelectElement> & { options: ReadonlyArray<{ value: string; label: string }> | readonly string[]; placeholder?: string }) {
  const fieldId = id ?? name;
  return (
    <Wrapper {...{ label, name, id: fieldId, error, hint, className, required }}>
      <select id={fieldId} name={name} required={required} className={control} {...aria(fieldId, error, hint)} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const opt = typeof o === "string" ? { value: o, label: o } : o;
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
    </Wrapper>
  );
}

export function Checkbox({ label, name, className, ...props }: { label: React.ReactNode; name: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn("flex items-start gap-2.5 text-sm", className)}>
      <input type="checkbox" name={name} className="mt-0.5 h-4 w-4 rounded border-beige-400 accent-forest-800" {...props} />
      <span>{label}</span>
    </label>
  );
}

export const controlClass = control;
