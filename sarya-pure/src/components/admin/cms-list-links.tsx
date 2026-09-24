import Link from "next/link";

const links = [
  { href: "/admin/cms/faqs", label: "FAQs" },
  { href: "/admin/cms/testimonials", label: "Testimonials" },
  { href: "/admin/cms/banners", label: "Banners" },
  { href: "/admin/cms/policies", label: "Legal & Policy Pages" },
];

export function CmsListLinks() {
  return (
    <section className="rounded-2xl border border-beige-300 bg-white p-5">
      <h2 className="font-semibold">More content</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="block rounded-lg border border-beige-300 px-4 py-3 text-sm font-medium hover:bg-beige-100">
              {l.label} →
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
