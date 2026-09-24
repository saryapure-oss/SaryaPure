import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({ page, pages, basePath, params }: { page: number; pages: number; basePath: string; params: Record<string, string | undefined> }) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return `${basePath}${s ? `?${s}` : ""}`;
  };
  const nums: number[] = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) nums.push(i);
  const item = "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-medium";
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(item, "hover:bg-beige-200")} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(item, "opacity-40")} aria-hidden>
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}
      {nums.map((n) => (
        <Link key={n} href={href(n)} aria-current={n === page ? "page" : undefined} className={cn(item, n === page ? "bg-forest-900 text-cream-50" : "hover:bg-beige-200")}>
          {n}
        </Link>
      ))}
      {page < pages ? (
        <Link href={href(page + 1)} className={cn(item, "hover:bg-beige-200")} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(item, "opacity-40")} aria-hidden>
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
