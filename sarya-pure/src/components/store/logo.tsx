import Link from "next/link";
import Image from "next/image";

export function Logo({ name, logoUrl, light = false }: { name: string; logoUrl?: string; light?: boolean }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={`${name} — home`}>
      {logoUrl ? (
        <Image src={logoUrl} alt={name} width={140} height={40} className="h-9 w-auto" unoptimized={logoUrl.endsWith(".svg")} priority />
      ) : (
        <>
          <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden>
            <circle cx="20" cy="20" r="19" fill={light ? "#fbf7ef" : "#1f3d2b"} />
            <path d="M20 8c7 5 9 15 4 22-2 3-6 3-8 0-5-7-3-17 4-22Z" fill="#cfb26a" />
            <path d="M20 12c-1 6-1 12 0 18" stroke={light ? "#1f3d2b" : "#fbf7ef"} strokeWidth="1.4" fill="none" />
          </svg>
          <span className="leading-none">
            <span className={`block font-serif text-2xl font-semibold tracking-tight ${light ? "text-cream-50" : "text-forest-900"}`}>{name}</span>
          </span>
        </>
      )}
    </Link>
  );
}
