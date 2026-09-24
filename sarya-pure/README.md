# Sarya Pure — E-commerce Platform

A production-grade e-commerce application for **Sarya Pure Pvt Ltd** (premium dry fruits, nuts, seeds and gift hampers). Built with Next.js 16 (App Router), React 19, TypeScript, Prisma 7 + PostgreSQL, and Razorpay + COD payments.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL via Prisma 7 (WASM engine + `@prisma/adapter-pg`) |
| Validation | Zod, on both client and server — pricing/inventory logic is **server-side only** |
| Auth | Session cookies (`sp_session`, SHA-256 hashed token), RBAC: `CUSTOMER` / `ADMIN` / `SUPER_ADMIN` |
| Payments | Razorpay (online) + Cash on Delivery |
| Image storage | Local (dev only) / Cloudinary / S3-compatible (S3, R2, Spaces, MinIO) |
| Email | SMTP via Nodemailer (logs to console if unconfigured) |
| Testing | Vitest (unit) + Playwright (e2e) |

## Admin dashboard — full control

Everything below is manageable from `/admin` with no code changes, gated by role (`ADMIN` / `SUPER_ADMIN`) and logged to the audit log:

- **Catalog**: categories, products, variants, images (upload/delete), inventory levels, gift boxes (bundle any product's variants into a gift hamper product).
- **Sales**: orders (status, refunds, admin notes, cancellation), coupons (percentage/fixed, scoped to all/products/categories), reviews (moderate/feature).
- **Customers & leads**: customer list with order history, B2B enquiries, contact messages, newsletter subscribers (with CSV export).
- **Site content (CMS)**: announcement bar, homepage hero/sections, About page, footer, FAQs, testimonials, banners, and all six legal policy pages (with a placeholder-content warning until reviewed).
- **Configuration**: business/legal details, commerce rules (tax, shipping thresholds, COD limits), payment settings, social links, SEO defaults, shipping zones.
- **Staff & Access** (Super Admin only): grant or revoke admin access for any existing registered account, change staff roles, deactivate/reactivate staff accounts — no server access or CLI needed after the first admin is created.
- **Audit Log** (Super Admin only): a full history of every sensitive admin action, who did it, and when.

## Project structure

```
src/
  app/
    (auth)/            Login, register, password reset, email verification
    (store)/            Public storefront — shop, product pages, cart, checkout,
                         account, about/contact/b2b/faq/gift-hampers/policies/*
    admin/               Admin dashboard (products, orders, customers, coupons,
                         reviews, CMS, settings, shipping, audit log)
    actions/             Server Actions (mutations) — actions/admin/* for admin-only
    api/                 Route handlers: search suggest, analytics beacon,
                         Razorpay webhook, reservation-release cron
    sitemap.ts, robots.ts, not-found.tsx, error.tsx, global-error.tsx
  components/
    ui/                  Generic building blocks (Input, Button, Markdown, ...)
    store/                Storefront-specific components
    admin/                Admin-specific components
  lib/
    auth/                Session, permissions (RBAC), page/action guards
    services/            Domain logic: catalog, orders, checkout, storage, email, audit
    security/             Rate limiting, request helpers, crypto
    settings.ts, settings-schema.ts   Admin-editable site settings (Zod schemas, safe defaults)
    validation/           Shared Zod schemas + form helpers
  generated/prisma/       Generated Prisma client (custom output path)
prisma/
  schema.prisma           Full data model
  seed.ts                 Demo/seed data (clearly flagged with isDemo/isPlaceholder)
e2e/                       Playwright end-to-end specs
scripts/create-admin.ts    Bootstraps the first SUPER_ADMIN account
```

## Getting started

### 1. Prerequisites

- Node.js ≥ 20.9
- A PostgreSQL database (local, Neon, Supabase, RDS, etc.)

### 2. Install & configure

```bash
npm install
cp .env.example .env
```

Fill in `.env` — every variable is documented inline in `.env.example`. At minimum for local development you need:

- `DATABASE_URL` / `DIRECT_URL` — your Postgres connection string
- `AUTH_SECRET` — `openssl rand -base64 48`
- `NEXT_PUBLIC_SITE_URL` — `http://localhost:3000` locally

Everything else (Razorpay, SMTP, Cloudinary/S3, cron secret) has safe fallbacks for local dev: payments can run in `RAZORPAY_MOCK=true` mode, emails log to the console, and images are written to `public/uploads` (local storage — **not** viable on Vercel; configure Cloudinary or S3 for any real deployment).

### 3. Database

```bash
npm run db:migrate     # create tables from prisma/schema.prisma
npm run db:seed        # optional: seed demo categories/products/CMS content
npm run admin:create   # create your first SUPER_ADMIN (reads ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_NAME from .env)
```

### 4. Run

```bash
npm run dev
```

Storefront: http://localhost:3000 · Admin dashboard: http://localhost:3000/admin

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint (`--max-warnings=0` recommended in CI) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright end-to-end tests (spins up its own server) |
| `npm run db:migrate` | Apply Prisma migrations (dev) |
| `npm run db:deploy` | Apply migrations (production, no prompts) |
| `npm run db:studio` | Prisma Studio (visual DB browser) |
| `npm run admin:create` | Create/promote a SUPER_ADMIN account |

## Deployment (Vercel or similar)

> **Want to host this for free?** See [`HOSTING.md`](./HOSTING.md) for a full step-by-step guide using Vercel + Neon (Postgres) + Cloudinary + Brevo, all on free tiers.

1. Set every variable from `.env.example` in your hosting provider's environment settings.
2. Use `npm run vercel-build` (or equivalent: `prisma generate && prisma migrate deploy && next build`) as the build command — this applies pending migrations before building.
3. Set `STORAGE_DRIVER=cloudinary` or `STORAGE_DRIVER=s3` — local file storage does **not** persist on serverless platforms.
4. Configure the Razorpay webhook (Dashboard → Webhooks) to point at `/api/webhooks/razorpay` with `RAZORPAY_WEBHOOK_SECRET` set.
5. Configure a scheduled job to hit `/api/cron/release-reservations` every 10–15 minutes with an `Authorization: Bearer $CRON_SECRET` header, so abandoned checkouts release their reserved stock promptly. `vercel.json` ships with a once-daily Vercel Cron as a fallback (Vercel's free Hobby plan only allows daily cron schedules) — on a paid plan you can tighten that schedule directly instead of using an external pinger.
6. Run `npm run admin:create` once (locally, pointed at the production `DATABASE_URL`, or via a one-off job) to create the first admin account.

## What was tested

- **Type safety**: `tsc --noEmit` passes with zero errors across the full codebase.
- **Lint**: `eslint . --max-warnings=0` passes clean.
- **Build**: `next build` compiles and statically/dynamically renders all ~65 routes successfully.
- **Unit tests (Vitest)**: pure business-logic functions — money/pricing math (`formatINR`, `discountPercent`, paise↔rupee conversion), the RBAC permission matrix (`can()`, every role × every permission), and the shared Zod validators/form helpers used by every Server Action.
- **End-to-end (Playwright)**, all passing:
  - Customer journey: register → browse → add to cart → apply coupon → checkout (COD) → order tracking.
  - Admin journey: login → create category → create product → add variant/inventory → publish → product visible on storefront.
  - Admin order handling: customer places an order → admin sees it in the order list → updates its status.
  - Storefront content pages: about/FAQ/gift-hampers render, policy pages show the placeholder-content warning, contact and B2B forms submit successfully end-to-end (writing to the database and triggering the configured notification path), and unknown routes return a proper custom 404.
  - Admin controls: newsletter subscriber list + CSV export, granting/rejecting staff admin access by email, and the missing-product-image warning surfacing correctly in the admin product list.
- **Manual smoke checks**: every new route verified to return the correct HTTP status code and real (non-empty, non-error) content, including `sitemap.xml` and `robots.txt` output; verified every seeded product's image file actually exists on disk.

## Security notes

- All pricing, discounting, tax, shipping and inventory calculations happen server-side (`src/lib/services/*`) — the client never supplies a price, and Server Actions re-validate everything with Zod.
- Passwords are hashed with bcrypt (cost 12); sessions are opaque random tokens, only their SHA-256 hash is stored.
- Every sensitive admin mutation is permission-checked (`assertPermission`) and written to an audit log (`src/app/admin/audit-log`).
- Image uploads are content-sniffed (magic bytes), not trusted by declared MIME/extension, and re-encoded (stripping EXIF/any embedded payload) before storage.
- Contact and B2B forms are rate-limited and honeypot-protected.
- `not-found.tsx` / `error.tsx` / `global-error.tsx` never leak stack traces to the client.

## Business information that still needs to be filled in

Per the project's non-negotiable rule, **no business facts were invented**. The following are empty by default and must be entered by an admin (Admin → Settings / CMS) before launch:

- **Settings → Business**: company/brand name confirmation, registered address, phone, WhatsApp number, business hours, Google Maps embed URL.
- **Settings → Legal**: GSTIN, FSSAI license number, CIN, registered office, other registration details.
- **Settings → Payment**: live Razorpay key ID/secret/webhook secret (test/mock values only ship by default).
- **Settings → Social**: Instagram/Facebook/YouTube/LinkedIn URLs.
- **CMS → Policies**: all six policy pages (`shipping-policy`, `return-refund-policy`, `cancellation-policy`, `privacy-policy`, `terms-and-conditions`, `cookie-policy`) are seeded with clearly labelled **placeholder text** — each shows a visible "not yet reviewed by a legal professional" warning on the storefront until an admin edits and un-flags it (`isPlaceholder`).
- **CMS → About**: company story, founders, milestones (a placeholder note ships in the default body).
- **CMS → Testimonials / Product catalog**: seed data (if used) is flagged `isDemo` and shown on the storefront with a visible "Demo" badge — replace with real customer testimonials and real product data (or unpublish/delete the demo rows) before go-live.
