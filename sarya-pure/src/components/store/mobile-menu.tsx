"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export function MobileMenu({
  nav,
  categories,
  isLoggedIn,
  whatsapp,
}: {
  nav: { href: string; label: string }[];
  categories: { name: string; slug: string }[];
  isLoggedIn: boolean;
  whatsapp: string | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button type="button" className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-beige-200 lg:hidden" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
        <Menu className="h-6 w-6" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-forest-950/40" onClick={() => setOpen(false)} />
          <nav className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col overflow-y-auto bg-cream-100 p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-serif text-2xl text-forest-900">Menu</span>
              <button ref={closeRef} type="button" onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-beige-200" aria-label="Close menu">
                <X className="h-6 w-6" />
              </button>
            </div>
            <ul className="space-y-1">
              {nav.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="block rounded-lg px-3 py-3 text-base font-medium hover:bg-beige-200">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="eyebrow mt-6 px-3">Shop by category</p>
            <ul className="mt-2 grid grid-cols-2 gap-1">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`} className="block rounded-lg px-3 py-2 text-sm hover:bg-beige-200">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-auto space-y-1 border-t border-beige-300 pt-4">
              <Link href={isLoggedIn ? "/account" : "/login"} className="block rounded-lg px-3 py-3 font-medium hover:bg-beige-200">
                {isLoggedIn ? "My account" : "Sign in / Register"}
              </Link>
              <Link href="/wishlist" className="block rounded-lg px-3 py-3 font-medium hover:bg-beige-200">
                Wishlist
              </Link>
              <Link href="/track-order" className="block rounded-lg px-3 py-3 font-medium hover:bg-beige-200">
                Track order
              </Link>
              {whatsapp && (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="block rounded-lg px-3 py-3 font-medium text-forest-700 hover:bg-beige-200">
                  Chat on WhatsApp
                </a>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
