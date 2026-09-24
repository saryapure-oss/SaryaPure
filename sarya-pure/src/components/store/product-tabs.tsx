"use client";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export function ProductTabs({ tabs }: { tabs: { key: string; label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.key);
  const id = useId();
  const idx = tabs.findIndex((t) => t.key === active);
  return (
    <div>
      <div role="tablist" aria-label="Product information" className="flex gap-1 overflow-x-auto border-b border-beige-300">
        {tabs.map((t, i) => (
          <button
            key={t.key}
            id={`${id}-tab-${t.key}`}
            role="tab"
            type="button"
            aria-selected={t.key === active}
            aria-controls={`${id}-panel-${t.key}`}
            tabIndex={t.key === active ? 0 : -1}
            onClick={() => setActive(t.key)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]!;
                setActive(next.key);
                document.getElementById(`${id}-tab-${next.key}`)?.focus();
              }
            }}
            className={cn(
              "shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition",
              t.key === active ? "border-forest-800 text-forest-900" : "border-transparent text-muted hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div key={t.key} id={`${id}-panel-${t.key}`} role="tabpanel" aria-labelledby={`${id}-tab-${t.key}`} hidden={i !== idx} className="py-6" tabIndex={0}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
