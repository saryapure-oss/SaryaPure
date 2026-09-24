import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/utils";

const cormorant = localFont({
  src: "./fonts/cormorant.woff2",
  variable: "--font-cormorant",
  weight: "300 700",
  display: "swap",
});
const manrope = localFont({
  src: "./fonts/manrope.woff2",
  variable: "--font-manrope",
  weight: "200 800",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { seo, business } = await getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: seo.siteTitle, template: seo.titleTemplate || "%s" },
    description: seo.description,
    keywords: seo.keywords.split(",").map((k) => k.trim()).filter(Boolean),
    applicationName: business.brandName,
    openGraph: {
      type: "website",
      siteName: business.brandName,
      locale: "en_IN",
      title: seo.siteTitle,
      description: seo.description,
      images: seo.socialImage ? [{ url: seo.socialImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: { card: "summary_large_image", title: seo.siteTitle, description: seo.description },
    alternates: { canonical: "/" },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#1f3d2b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${cormorant.variable} ${manrope.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
