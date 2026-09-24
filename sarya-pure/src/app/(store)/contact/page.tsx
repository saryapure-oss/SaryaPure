import type { Metadata } from "next";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ContactForm } from "@/components/store/contact-form";
import { WhatsAppIcon } from "@/components/store/whatsapp-icon";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Sarya Pure for questions about orders, products or bulk enquiries.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const { business } = await getSettings();
  const wa = whatsappLink(business.whatsapp, "Hi, I'd like to get in touch with Sarya Pure.");
  const details = [
    business.address && { icon: MapPin, label: "Address", value: business.address },
    business.phone && { icon: Phone, label: "Phone", value: business.phone, href: `tel:${business.phone}` },
    business.email && { icon: Mail, label: "Email", value: business.email, href: `mailto:${business.email}` },
    business.businessHours && { icon: Clock, label: "Hours", value: business.businessHours },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href?: string }[];

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Contact" }]} />
      <h1 className="mt-4 text-4xl sm:text-5xl">Contact Us</h1>
      <p className="mt-2 max-w-2xl text-muted">We&apos;d love to hear from you. Send us a message and our team will get back to you soon.</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-6">
          {details.length > 0 ? (
            <div className="space-y-5 rounded-2xl border border-beige-300 bg-cream-50 p-6">
              {details.map((d) => (
                <div key={d.label} className="flex items-start gap-3">
                  <d.icon className="mt-0.5 h-5 w-5 shrink-0 text-forest-700" aria-hidden />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-brown-600">{d.label}</p>
                    {d.href ? (
                      <a href={d.href} className="font-medium text-ink hover:text-forest-700 hover:underline">
                        {d.value}
                      </a>
                    ) : (
                      <p className="font-medium text-ink whitespace-pre-line">{d.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-beige-400 bg-cream-50 p-6 text-sm text-muted">
              Our contact details will be published here shortly. Please use the form to reach us in the meantime.
            </p>
          )}
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
            >
              <WhatsAppIcon className="h-5 w-5" /> Chat on WhatsApp
            </a>
          )}
          {business.mapEmbedUrl && (
            <div className="overflow-hidden rounded-2xl border border-beige-300">
              <iframe src={business.mapEmbedUrl} title="Location map" loading="lazy" className="h-64 w-full border-0" />
            </div>
          )}
        </div>
        <div className="card p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-ink">Send us a message</h2>
          <div className="mt-5">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
