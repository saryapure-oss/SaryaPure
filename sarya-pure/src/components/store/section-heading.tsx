import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({ id, eyebrow, title, link, center = false }: { id?: string; eyebrow?: string; title: string; link?: { href: string; label: string }; center?: boolean }) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", center && "flex-col items-center text-center")}>
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 id={id} className="mt-2 text-4xl sm:text-5xl">
          {title}
        </h2>
      </div>
      {link && (
        <Link href={link.href} className="inline-flex items-center gap-1 text-sm font-semibold text-forest-800 hover:gap-2 hover:underline">
          {link.label} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}
