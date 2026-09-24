import { cn } from "@/lib/utils";

export function FormMessage({ ok, message, className }: { ok?: boolean; message?: string; className?: string }) {
  if (!message) return null;
  return (
    <div
      role={ok ? "status" : "alert"}
      aria-live="polite"
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        ok ? "border-forest-600/30 bg-forest-50 text-forest-900" : "border-red-300 bg-red-50 text-red-800",
        className,
      )}
    >
      {message}
    </div>
  );
}
