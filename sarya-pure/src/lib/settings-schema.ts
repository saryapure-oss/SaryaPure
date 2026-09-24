import { z } from "zod";

/**
 * Admin-editable site settings. Every field has a safe default.
 * Business facts (address, phone, GSTIN, FSSAI...) default to EMPTY — never invented.
 */

const str = (d = "") => z.string().max(5000).default(d);
const link = z.object({ label: z.string().max(60).default(""), href: z.string().max(300).default("") });

export const settingsSchemas = {
  business: z.object({
    companyName: str("Sarya Pure Pvt Ltd"),
    brandName: str("Sarya Pure"),
    logoUrl: str(),
    address: str(),
    phone: str(),
    email: str(),
    whatsapp: str(),
    businessHours: str(),
    mapEmbedUrl: str(),
  }),
  legal: z.object({
    gstin: str(),
    fssai: str(),
    cin: str(),
    registeredOffice: str(),
    registrationDetails: str(),
  }),
  commerce: z.object({
    currency: z.literal("INR").default("INR"),
    /** Indian retail prices are normally inclusive of GST */
    pricesIncludeTax: z.boolean().default(true),
    defaultTaxRate: z.number().min(0).max(28).default(5),
    freeShippingThreshold: z.number().int().min(0).default(99900),
    flatShippingRate: z.number().int().min(0).default(7900),
    /** When true, PIN codes not matched by any shipping zone are still served at the flat rate */
    allowAllPincodes: z.boolean().default(true),
    defaultEtaMinDays: z.number().int().min(0).default(3),
    defaultEtaMaxDays: z.number().int().min(0).default(7),
    codEnabled: z.boolean().default(true),
    codFee: z.number().int().min(0).default(0),
    codMaxOrderValue: z.number().int().min(0).default(500000),
    reservationMinutes: z.number().int().min(5).max(1440).default(30),
    maxQtyPerItem: z.number().int().min(1).max(50).default(20),
  }),
  payment: z.object({
    razorpayEnabled: z.boolean().default(true),
    razorpayDisplayName: str("Sarya Pure"),
  }),
  social: z.object({
    instagram: str(),
    facebook: str(),
    youtube: str(),
    linkedin: str(),
  }),
  seo: z.object({
    siteTitle: str("Sarya Pure — Premium Dry Fruits, Nuts & Gift Hampers"),
    titleTemplate: str("%s | Sarya Pure"),
    description: str(
      "Premium dry fruits and wholesome goodness, carefully selected for everyday health and special moments. Shop almonds, cashews, pistachios, dates, seeds and gift hampers.",
    ),
    keywords: str("dry fruits, premium almonds, cashews, pistachios, walnuts, dates, gift hampers, healthy snacks, India"),
    socialImage: str("/images/og-default.png"),
  }),
  announcement: z.object({
    enabled: z.boolean().default(true),
    text: str("Premium Dry Fruits  |  Naturally Good"),
    linkLabel: str("Shop Now"),
    linkHref: str("/shop"),
  }),
  hero: z.object({
    eyebrow: str("Sarya Pure"),
    headline: str("Pure Goodness. Naturally Premium."),
    description: str("Premium dry fruits and wholesome goodness, carefully selected for everyday health and special moments."),
    primaryCta: link.default({ label: "Shop Now", href: "/shop" }),
    secondaryCta: link.default({ label: "Explore Collections", href: "/categories" }),
    image: str("/images/hero.svg"),
    imageAlt: str("An assortment of almonds, cashews, pistachios and dates"),
  }),
  home: z.object({
    whyChoose: z
      .array(z.object({ title: z.string().max(80), text: z.string().max(300), icon: z.string().max(30) }))
      .default([
        { icon: "leaf", title: "Premium Selection", text: "Every batch is hand-picked for size, colour and taste before it earns the Sarya Pure name." },
        { icon: "check", title: "Quality Focused", text: "We inspect our produce at every step so you receive dry fruits you can serve with pride." },
        { icon: "box", title: "Carefully Packed", text: "Sealed packaging designed to protect freshness, crunch and flavour on the way to you." },
        { icon: "sun", title: "Fresh & Wholesome", text: "Natural goodness with no unnecessary additions — just the fruit, nut or seed you chose." },
        { icon: "heart", title: "Trusted Service", text: "Friendly support before and after your order, for homes and businesses alike." },
        { icon: "lock", title: "Secure Shopping", text: "Encrypted checkout with trusted payment options including UPI, cards and COD." },
      ]),
    qualityTitle: str("Quality you can see, taste and trust"),
    qualityBody: str(
      "Great dry fruits start long before they reach your kitchen. We focus on careful sourcing, thoughtful selection and packing that protects natural freshness — so every almond, cashew and date tastes the way nature intended.",
    ),
    lifestyleTitle: str("A handful of goodness, every day"),
    lifestyleBody: str(
      "Nuts, seeds and dried fruits are a naturally convenient part of a balanced diet. Enjoy them as a mid-day snack, in breakfast bowls, desserts or festive sweets.",
    ),
    lifestylePoints: z
      .array(z.string().max(200))
      .default([
        "Nuts and seeds naturally contain protein, fibre and healthy fats.",
        "Dried fruits like dates, figs and raisins bring natural sweetness.",
        "Pre-portioned handfuls make mindful snacking easier.",
        "Pair with yoghurt, oats or salads for texture and flavour.",
      ]),
    lifestyleDisclaimer: str(
      "General information only — not medical advice. Please consult a qualified professional for dietary guidance, especially if you have allergies or a medical condition.",
    ),
    b2bHeadline: str("Looking for Bulk Dry Fruits?"),
    b2bText: str(
      "We work with retailers, wholesalers, distributors, hotels, restaurants, cafés and corporate teams. Tell us what you need and our team will get back to you with a quote.",
    ),
    newsletterHeadline: str("Join the Sarya Pure Family"),
    newsletterText: str("Recipes, seasonal picks and member-only offers. No spam — unsubscribe anytime."),
  }),
  about: z.object({
    title: str("About Sarya Pure"),
    intro: str("Pure Goodness. Naturally Premium."),
    body: str(
      "Sarya Pure Pvt Ltd brings premium dry fruits, nuts, seeds and healthy snacks to homes and businesses across India.\n\nWe believe that everyday nutrition and special moments both deserve the best that nature has to offer. That is why we focus on careful selection, hygienic handling and packaging that protects freshness.\n\n_Add your company story, founders and milestones here from the admin panel._",
    ),
    image: str("/images/about.svg"),
  }),
  footer: z.object({
    about: str("Premium dry fruits and wholesome goodness, carefully selected for everyday health and special moments."),
    copyright: str("Sarya Pure Pvt Ltd. All rights reserved."),
  }),
} as const;

export type SettingsKey = keyof typeof settingsSchemas;
export type Settings = { [K in SettingsKey]: z.infer<(typeof settingsSchemas)[K]> };

export const SETTINGS_KEYS = Object.keys(settingsSchemas) as SettingsKey[];

export function parseSetting<K extends SettingsKey>(key: K, value: unknown): Settings[K] {
  const res = settingsSchemas[key].safeParse(value ?? {});
  return (res.success ? res.data : settingsSchemas[key].parse({})) as Settings[K];
}
