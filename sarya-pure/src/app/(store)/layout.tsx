import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { WhatsAppFloat } from "@/components/store/whatsapp-float";
import { ToastProvider } from "@/components/store/toast";
import { JsonLd } from "@/components/ui/json-ld";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/utils";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const { business, social, seo } = await getSettings();
  const sameAs = [social.instagram, social.facebook, social.youtube, social.linkedin].filter(Boolean);
  return (
    <ToastProvider>
      <Header />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <Footer />
      <WhatsAppFloat />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": siteUrl("/#organization"),
              name: business.companyName,
              url: siteUrl("/"),
              logo: business.logoUrl ? (business.logoUrl.startsWith("http") ? business.logoUrl : siteUrl(business.logoUrl)) : undefined,
              ...(business.email ? { email: business.email } : {}),
              ...(business.phone ? { telephone: business.phone } : {}),
              ...(sameAs.length ? { sameAs } : {}),
            },
            {
              "@type": "WebSite",
              "@id": siteUrl("/#website"),
              url: siteUrl("/"),
              name: business.brandName,
              description: seo.description,
              publisher: { "@id": siteUrl("/#organization") },
              potentialAction: { "@type": "SearchAction", target: `${siteUrl("/search")}?q={search_term_string}`, "query-input": "required name=search_term_string" },
            },
          ],
        }}
      />
    </ToastProvider>
  );
}
