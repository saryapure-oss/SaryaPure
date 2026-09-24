"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { formatINR } from "@/lib/money";

type Suggest = { products: { name: string; slug: string; price: number; image: string | null }[]; categories: { name: string; slug: string }[] };

export function SearchBox() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [data, setData] = useState<Suggest | null>(null);
  const [active, setActive] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (q.trim().length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal });
        if (res.ok) setData(await res.json());
      } catch {
        /* aborted */
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const shown = q.trim().length >= 2 ? data : null;
  const items = [
    ...(shown?.categories.map((c) => ({ href: `/category/${c.slug}`, label: c.name, kind: "Category" })) ?? []),
    ...(shown?.products.map((p) => ({ href: `/products/${p.slug}`, label: p.name, kind: formatINR(p.price) })) ?? []),
  ];

  function close() {
    setOpen(false);
    setActive(-1);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (active >= 0 && items[active]) router.push(items[active].href);
    else if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    close();
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-forest-900 hover:bg-beige-200" aria-label="Search products">
        <Search className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-forest-950/40" onClick={close} role="presentation">
          <div role="dialog" aria-modal="true" aria-label="Search" className="mx-auto mt-4 w-[calc(100%-2rem)] max-w-2xl" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.key === "Escape" && close()}>
            <form onSubmit={submit} role="search" className="card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-beige-300 px-4">
                <Search className="h-5 w-5 text-muted" aria-hidden />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setActive(-1);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActive((a) => Math.min(items.length - 1, a + 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActive((a) => Math.max(-1, a - 1));
                    }
                  }}
                  type="search"
                  name="q"
                  placeholder="Search almonds, cashews, SKU…"
                  aria-label="Search products"
                  role="combobox"
                  aria-expanded={items.length > 0}
                  aria-controls={listId}
                  aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
                  autoComplete="off"
                  maxLength={80}
                  className="h-14 flex-1 bg-transparent text-base outline-none"
                />
                <button type="button" onClick={close} className="rounded-full p-2 hover:bg-beige-200" aria-label="Close search">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ul id={listId} role="listbox" className="max-h-[60vh] overflow-y-auto">
                {items.map((it, i) => (
                  <li key={it.href} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                    <Link href={it.href} onClick={close} className={`flex items-center justify-between px-4 py-3 text-sm hover:bg-beige-200 ${i === active ? "bg-beige-200" : ""}`}>
                      <span>{it.label}</span>
                      <span className="text-xs text-muted">{it.kind}</span>
                    </Link>
                  </li>
                ))}
                {shown && items.length === 0 && <li className="px-4 py-4 text-sm text-muted">No matches for “{q}”. Press Enter to search all products.</li>}
              </ul>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
