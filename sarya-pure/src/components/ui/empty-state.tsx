import { ButtonLink } from "./button";

export function EmptyState({ title, text, cta, icon }: { title: string; text?: string; cta?: { href: string; label: string }; icon?: React.ReactNode }) {
  return (
    <div className="card mx-auto flex max-w-lg flex-col items-center px-6 py-14 text-center">
      {icon && <div className="mb-4 text-gold-500">{icon}</div>}
      <h2 className="text-2xl">{title}</h2>
      {text && <p className="mt-2 text-muted">{text}</p>}
      {cta && (
        <ButtonLink href={cta.href} className="mt-6">
          {cta.label}
        </ButtonLink>
      )}
    </div>
  );
}
