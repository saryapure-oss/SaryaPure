import Link from "next/link";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { Facebook, Instagram, Linkedin, Youtube } from "./social-icons";
import { getSettings } from "@/lib/settings";
import { Logo } from "./logo";
import { NewsletterForm } from "./newsletter-form";

const cols = [
  {
    title: "Shop",
    links: [
      ["All Products", "/shop"],
      ["Almonds", "/category/almonds"],
      ["Cashews", "/category/cashews"],
      ["Pistachios", "/category/pistachios"],
      ["Walnuts", "/category/walnuts"],
      ["Dates", "/category/dates"],
      ["Raisins", "/category/raisins"],
      ["Gift Hampers", "/gift-hampers"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About", "/about"],
      ["Contact", "/contact"],
      ["B2B / Bulk Orders", "/b2b"],
      ["FAQ", "/faq"],
    ],
  },
  {
    title: "Support",
    links: [
      ["Track Order", "/track-order"],
      ["Shipping", "/policies/shipping-policy"],
      ["Returns & Refunds", "/policies/return-refund-policy"],
      ["Cancellation", "/policies/cancellation-policy"],
      ["Privacy", "/policies/privacy-policy"],
      ["Terms", "/policies/terms-and-conditions"],
      ["Cookies", "/policies/cookie-policy"],
    ],
  },
] as const;

export async function Footer() {
  const { business, legal, social, footer, home } = await getSettings();
  const socials = [
    { href: social.instagram, label: "Instagram", Icon: Instagram },
    { href: social.facebook, label: "Facebook", Icon: Facebook },
    { href: social.youtube, label: "YouTube", Icon: Youtube },
    { href: social.linkedin, label: "LinkedIn", Icon: Linkedin },
  ].filter((s) => s.href);

  return (
    <footer className="mt-24 bg-forest-950 text-cream-100">
      <div className="border-b border-white/10">
        <div className="container-page grid gap-8 py-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl text-cream-50">{home.newsletterHeadline}</h2>
            <p className="mt-2 max-w-md text-cream-100/80">{home.newsletterText}</p>
          </div>
          <NewsletterForm />
        </div>
      </div>
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo name={business.brandName} logoUrl={business.logoUrl} light />
          <p className="mt-4 max-w-sm text-sm leading-6 text-cream-100/80">{footer.about}</p>
          <ul className="mt-6 space-y-2 text-sm text-cream-100/85">
            {business.address && (
              <li className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                <span className="whitespace-pre-line">{business.address}</span>
              </li>
            )}
            {business.phone && (
              <li className="flex gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                <a href={`tel:${business.phone.replace(/\s/g, "")}`} className="hover:underline">
                  {business.phone}
                </a>
              </li>
            )}
            {business.email && (
              <li className="flex gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                <a href={`mailto:${business.email}`} className="hover:underline">
                  {business.email}
                </a>
              </li>
            )}
            {business.businessHours && (
              <li className="flex gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                <span>{business.businessHours}</span>
              </li>
            )}
          </ul>
          {socials.length > 0 && (
            <ul className="mt-6 flex gap-2" aria-label="Social media">
              {socials.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 hover:border-gold-400 hover:text-gold-300">
                    <Icon className="h-4 w-4" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.16em] text-gold-300">{c.title}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {c.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-cream-100/85 hover:text-cream-50 hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-cream-100/70 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {footer.copyright}
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            {legal.gstin && <span>GSTIN: {legal.gstin}</span>}
            {legal.fssai && <span>FSSAI Lic. No.: {legal.fssai}</span>}
            {legal.cin && <span>CIN: {legal.cin}</span>}
          </p>
        </div>
      </div>
    </footer>
  );
}
