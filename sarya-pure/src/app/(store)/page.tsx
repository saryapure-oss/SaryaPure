import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, Gift, HeartHandshake, Leaf, Package, PartyPopper, ShieldCheck, Sparkles, Sun, Crown, Truck, Lock } from "lucide-react";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { cardSelect, getPublishedCategories } from "@/lib/services/catalog";
import { ButtonLink } from "@/components/ui/button";
import { SmartImage } from "@/components/ui/smart-image";
import { ProductGrid } from "@/components/store/product-card";
import { SectionHeading } from "@/components/store/section-heading";
import { FaqList } from "@/components/store/faq-list";
import { Stars } from "@/components/ui/stars";
import { DemoBadge, Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/money";

const ICONS = { leaf: Leaf, check: BadgeCheck, box: Package, sun: Sun, heart: HeartHandshake, lock: ShieldCheck } as const;

const HOME_CATEGORY_SLUGS = ["almonds", "cashews", "pistachios", "walnuts", "raisins", "dates", "figs", "seeds", "mixed-dry-fruits", "gift-hampers"];

export default async function HomePage() {
  const [settings, categories, bestSellers, featured, faqs, testimonials, reviews, banners] = await Promise.all([
    getSettings(),
    getPublishedCategories(),
    db.product.findMany({ where: { isPublished: true, OR: [{ isBestSeller: true }, { soldCount: { gt: 0 } }] }, orderBy: [{ soldCount: "desc" }, { isBestSeller: "desc" }], take: 8, select: cardSelect }),
    db.product.findMany({ where: { isPublished: true, isFeatured: true }, orderBy: { updatedAt: "desc" }, take: 4, select: cardSelect }),
    db.fAQ.findMany({ where: { isPublished: true, showOnHome: true }, orderBy: { sortOrder: "asc" }, take: 6 }),
    db.testimonial.findMany({ where: { isPublished: true }, orderBy: { sortOrder: "asc" }, take: 6 }),
    db.review.findMany({
      where: { status: "APPROVED", isFeatured: true },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: { select: { name: true } }, product: { select: { name: true, slug: true } } },
    }),
    db.banner.findMany({ where: { isActive: true, placement: "HOME_PROMO" }, orderBy: { sortOrder: "asc" }, take: 1 }),
  ]);
  const { hero, home, commerce } = settings;
  const trustPoints = [
    { Icon: Leaf, title: "100% Natural", text: "No additives, no shortcuts" },
    { Icon: Truck, title: "Fast Delivery", text: `Free shipping over ${formatINR(commerce.freeShippingThreshold)}` },
    { Icon: Lock, title: "Secure Payments", text: "UPI, cards & COD" },
    { Icon: BadgeCheck, title: "Quality Assured", text: "Hand-picked, freshness checked" },
  ];
  const homeCats = HOME_CATEGORY_SLUGS.map((s) => categories.find((c) => c.slug === s && c.showOnHome)).filter(Boolean) as typeof categories;
  const extraCats = categories.filter((c) => c.showOnHome && !HOME_CATEGORY_SLUGS.includes(c.slug));
  const shownCats = [...homeCats, ...extraCats].slice(0, 10);
  const promo = banners[0];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-cream-100">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gold-300/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-forest-100/70 blur-3xl" aria-hidden />
        <div className="container-page relative grid items-center gap-10 py-12 md:py-16 lg:grid-cols-2 lg:py-24">
          <div className="max-w-xl">
            {hero.eyebrow && <p className="eyebrow">{hero.eyebrow}</p>}
            <h1 className="mt-4 text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">{hero.headline}</h1>
            <div className="gold-rule mt-6" />
            <p className="mt-6 text-lg leading-8 text-muted">{hero.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {hero.primaryCta.label && (
                <ButtonLink href={hero.primaryCta.href || "/shop"} size="lg" className="shadow-[0_12px_28px_-10px_rgb(31_61_43_/_0.45)]">
                  {hero.primaryCta.label}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </ButtonLink>
              )}
              {hero.secondaryCta.label && (
                <ButtonLink href={hero.secondaryCta.href || "/categories"} size="lg" variant="secondary">
                  {hero.secondaryCta.label}
                </ButtonLink>
              )}
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
              {trustPoints.slice(0, 3).map(({ Icon, title }) => (
                <span key={title} className="inline-flex items-center gap-2 text-sm font-medium text-forest-800">
                  <Icon className="h-4 w-4 text-gold-600" aria-hidden />
                  {title}
                </span>
              ))}
            </div>
          </div>
          <div className="relative mx-auto aspect-[10/9] w-full max-w-xl">
            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-cream-50 to-beige-200 shadow-[var(--shadow-soft)]" aria-hidden />
            {hero.image && <SmartImage src={hero.image} alt={hero.imageAlt} fill priority sizes="(min-width:1024px) 45vw, 90vw" className="relative object-contain" />}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-beige-300/70 bg-cream-50">
        <div className="container-page grid grid-cols-2 gap-6 py-8 sm:grid-cols-4">
          {trustPoints.map(({ Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-800 ring-1 ring-gold-400/50">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-serif text-base font-semibold text-forest-900">{title}</p>
                <p className="text-xs text-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured categories */}
      <section className="container-page py-16" aria-labelledby="cat-heading">
        <SectionHeading id="cat-heading" eyebrow="Shop by category" title="Featured Categories" link={{ href: "/categories", label: "All categories" }} />
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
          {shownCats.map((c) => (
            <li key={c.id}>
              <Link href={`/category/${c.slug}`} className="group card block overflow-hidden text-center transition hover:-translate-y-0.5">
                <div className="relative aspect-square bg-cream-200">
                  {c.image && <SmartImage src={c.image} alt="" fill sizes="(min-width:1024px) 18vw, 45vw" className="object-cover transition duration-500 group-hover:scale-105" />}
                </div>
                <span className="block px-2 py-3 font-serif text-xl font-semibold text-forest-900">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Best sellers */}
      {bestSellers.length > 0 && (
        <section className="bg-cream-200/60 py-16" aria-labelledby="best-heading">
          <div className="container-page">
            <SectionHeading id="best-heading" eyebrow="Customer favourites" title="Best Sellers" link={{ href: "/shop?sort=popular", label: "Shop all" }} />
            <div className="mt-8">
              <ProductGrid products={bestSellers} />
            </div>
          </div>
        </section>
      )}

      {/* Why choose */}
      <section className="container-page py-16" aria-labelledby="why-heading">
        <SectionHeading id="why-heading" eyebrow="The Sarya Pure promise" title="Why Choose Sarya Pure" center />
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {home.whyChoose.map((w) => {
            const Icon = ICONS[w.icon as keyof typeof ICONS] ?? Sparkles;
            return (
              <li key={w.title} className="card p-6">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-forest-50 text-forest-800 ring-1 ring-gold-400/50">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-4 text-2xl">{w.title}</h3>
                <p className="mt-2 text-muted">{w.text}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Premium quality */}
      <section className="bg-forest-900 text-cream-100" aria-labelledby="quality-heading">
        <div className="container-page grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-20">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <SmartImage src={settings.about.image || "/images/about.svg"} alt="" fill sizes="(min-width:1024px) 45vw, 90vw" className="object-cover" />
          </div>
          <div>
            <p className="eyebrow text-gold-300">Premium quality</p>
            <h2 id="quality-heading" className="mt-3 text-4xl text-cream-50 sm:text-5xl">
              {home.qualityTitle}
            </h2>
            <div className="gold-rule mt-5" />
            <p className="mt-5 text-lg leading-8 text-cream-100/85">{home.qualityBody}</p>
            <ButtonLink href="/about" variant="gold" className="mt-8">
              Our story
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Featured collection */}
      {featured.length > 0 && (
        <section className="container-page py-16" aria-labelledby="featured-heading">
          <SectionHeading id="featured-heading" eyebrow="Hand-picked" title="Featured Collection" link={{ href: "/shop", label: "View all" }} />
          <div className="mt-8">
            <ProductGrid products={featured} />
          </div>
        </section>
      )}

      {/* Healthy lifestyle */}
      <section className="bg-beige-200/60 py-16" aria-labelledby="life-heading">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="eyebrow">Healthy lifestyle</p>
            <h2 id="life-heading" className="mt-3 text-4xl sm:text-5xl">
              {home.lifestyleTitle}
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted">{home.lifestyleBody}</p>
          </div>
          <div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {home.lifestylePoints.map((pt) => (
                <li key={pt} className="card flex gap-3 p-5">
                  <Leaf className="mt-1 h-5 w-5 shrink-0 text-forest-700" aria-hidden />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted">{home.lifestyleDisclaimer}</p>
          </div>
        </div>
      </section>

      {/* Gift hampers */}
      <section className="container-page py-16" aria-labelledby="gift-heading">
        <SectionHeading id="gift-heading" eyebrow="Gifting" title="Gift Hampers for Every Occasion" link={{ href: "/gift-hampers", label: "Explore hampers" }} />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: "Corporate Gifts", d: "Thoughtful hampers for clients and teams, with bulk options.", Icon: Building2, type: "CORPORATE" },
            { t: "Festival Gifts", d: "Celebrate Diwali, Raksha Bandhan, Eid and more.", Icon: PartyPopper, type: "FESTIVAL" },
            { t: "Wedding Gifts", d: "Elegant boxes for shagun, favours and family.", Icon: Gift, type: "WEDDING" },
            { t: "Premium Hampers", d: "Our finest selection, beautifully presented.", Icon: Crown, type: "PREMIUM" },
          ].map(({ t, d, Icon, type }) => (
            <li key={t}>
              <Link href={`/gift-hampers?type=${type}`} className="card group flex h-full flex-col p-6 transition hover:-translate-y-0.5">
                <Icon className="h-8 w-8 text-gold-500" aria-hidden />
                <h3 className="mt-4 text-2xl">{t}</h3>
                <p className="mt-2 flex-1 text-muted">{d}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-forest-800 group-hover:gap-2">
                  Browse <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {promo && (
          <Link href={promo.link || "/gift-hampers"} className="mt-8 grid overflow-hidden rounded-2xl bg-forest-900 text-cream-50 md:grid-cols-2">
            <div className="p-8 md:p-12">
              <h3 className="text-3xl text-cream-50 md:text-4xl">{promo.title}</h3>
              {promo.subtitle && <p className="mt-3 text-cream-100/85">{promo.subtitle}</p>}
              {promo.ctaLabel && (
                <span className="mt-6 inline-flex items-center gap-2 font-semibold text-gold-300">
                  {promo.ctaLabel} <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              )}
            </div>
            {promo.image && (
              <div className="relative min-h-56">
                <SmartImage src={promo.image} alt="" fill sizes="(min-width:768px) 45vw, 90vw" className="object-cover" />
              </div>
            )}
          </Link>
        )}
      </section>

      {/* B2B */}
      <section className="container-page" aria-labelledby="b2b-heading">
        <div className="card flex flex-col items-start gap-6 bg-cream-50 p-8 md:flex-row md:items-center md:justify-between md:p-12">
          <div className="max-w-2xl">
            <p className="eyebrow">Bulk & corporate</p>
            <h2 id="b2b-heading" className="mt-2 text-4xl">
              {home.b2bHeadline}
            </h2>
            <p className="mt-3 text-muted">{home.b2bText}</p>
          </div>
          <ButtonLink href="/b2b" size="lg">
            Send Bulk Enquiry
          </ButtonLink>
        </div>
      </section>

      {/* Testimonials — only approved reviews or admin-published testimonials; demo entries are labelled */}
      {(reviews.length > 0 || testimonials.length > 0) && (
        <section className="container-page py-16" aria-labelledby="t-heading">
          <SectionHeading id="t-heading" eyebrow="Kind words" title="What Our Customers Say" center />
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {reviews.map((r) => (
              <li key={r.id} className="card flex flex-col p-6">
                <Stars rating={r.rating} />
                <blockquote className="mt-3 flex-1 text-ink">“{r.body}”</blockquote>
                <p className="mt-4 text-sm font-semibold">{r.user.name.split(" ")[0]}</p>
                <p className="text-xs text-muted">
                  on <Link href={`/products/${r.product.slug}`} className="underline">{r.product.name}</Link>
                </p>
                {r.isVerifiedPurchase && <Badge className="mt-2 self-start">Verified Purchase</Badge>}
              </li>
            ))}
            {testimonials.slice(0, Math.max(0, 6 - reviews.length)).map((t) => (
              <li key={t.id} className="card flex flex-col p-6">
                <Stars rating={t.rating} />
                <blockquote className="mt-3 flex-1 text-ink">“{t.content}”</blockquote>
                <p className="mt-4 text-sm font-semibold">{t.name}</p>
                {t.location && <p className="text-xs text-muted">{t.location}</p>}
                {t.isDemo && <DemoBadge className="mt-2 self-start" />}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="container-page pb-4" aria-labelledby="faq-heading">
          <SectionHeading id="faq-heading" eyebrow="Help" title="Frequently Asked Questions" link={{ href: "/faq", label: "All FAQs" }} />
          <div className="mt-8 max-w-3xl">
            <FaqList faqs={faqs} withSchema />
          </div>
        </section>
      )}
    </>
  );
}
