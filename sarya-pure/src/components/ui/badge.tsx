import { cn } from "@/lib/utils";

const tones = {
  green: "bg-forest-50 text-forest-800 ring-forest-700/20",
  gold: "bg-gold-300/40 text-gold-700 ring-gold-500/30",
  brown: "bg-beige-200 text-brown-700 ring-brown-500/20",
  red: "bg-red-50 text-red-800 ring-red-600/20",
  gray: "bg-stone-100 text-stone-700 ring-stone-500/20",
  blue: "bg-sky-50 text-sky-800 ring-sky-600/20",
} as const;

export function Badge({ tone = "green", className, children }: { tone?: keyof typeof tones; className?: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", tones[tone], className)}>{children}</span>;
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <Badge tone="gray" className={className}>
      Demo content
    </Badge>
  );
}
