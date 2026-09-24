# Free Hosting Guide — Sarya Pure

This guide deploys the whole app — Next.js app, PostgreSQL database, product images, transactional email, and payments — using **only free tiers**. No credit card is required for any step below except Razorpay (which is free to integrate; you only pay a per-transaction fee once you accept a real payment).

> **Reality check before you start**: Vercel's free "Hobby" plan is intended for personal/non-commercial projects. It works perfectly for testing, demos, and low-traffic real stores, and plenty of small businesses run on it — but it is not a paid commercial SLA. If Sarya Pure grows real order volume, plan to move to Vercel Pro (~$20/month) or another paid host at that point. Everything below still gets you a fully working, real, production app for ₹0 to start.

## What you'll set up (all free)

| Piece | Service | Free tier |
|---|---|---|
| App hosting | **Vercel** (Hobby) | 100 GB bandwidth/mo, no card required |
| Database | **Neon** (Postgres) | 0.5 GB storage, 100 compute-hours/mo, no card required |
| Product images | **Cloudinary** | ~25 GB combined storage+bandwidth/mo, no card required |
| Transactional email | **Brevo** (SMTP) | 300 emails/day, no card required |
| Payments | **Razorpay** | Free to integrate; per-transaction fee only on real payments |
| Background job (stock release) | **cron-job.org** | Free, no card required |

Total ongoing cost while you're small: **₹0/month**.

---

## 1. Push the code to GitHub

Vercel deploys from a Git repository.

```bash
cd sarya-pure
git init                     # if not already a repo
git add .
git commit -m "Initial commit"
```

Create a new empty repository on [github.com](https://github.com/new), then:

```bash
git remote add origin https://github.com/<your-username>/sarya-pure.git
git branch -M main
git push -u origin main
```

## 2. Create the database (Neon)

1. Go to [neon.tech](https://neon.tech) → **Sign up** (GitHub login is fastest, no card needed).
2. Create a project (any region close to your customers, e.g. Mumbai/Singapore).
3. On the project dashboard, copy the **pooled connection string** (labelled "Pooled connection" — important for serverless use) — this is your `DATABASE_URL`.
4. Also copy the **direct connection string** (unpooled) — this is your `DIRECT_URL`, used only for running migrations.

Neon's free tier auto-suspends compute after inactivity and wakes on the next request in about a second — fine for a small store.

## 3. Set up image storage (Cloudinary)

1. Go to [cloudinary.com](https://cloudinary.com) → **Sign up** free.
2. On your Dashboard, note down: **Cloud name**, **API Key**, **API Secret**.
3. You'll set these as `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in step 6.

This is what makes **every product image work correctly in production** — local file storage (the dev-only default) does not persist on Vercel's serverless filesystem, so images uploaded through the admin panel would silently disappear on the next deploy without this.

## 4. Set up transactional email (Brevo)

1. Go to [brevo.com](https://www.brevo.com) → **Sign up** free (300 emails/day, no card).
2. Go to **Settings → SMTP & API → SMTP** — Brevo shows you an SMTP login and a generated SMTP key (this key is your SMTP password, not your account password).
3. Note: host `smtp-relay.brevo.com`, port `587`, your SMTP login (an email-like ID), and the SMTP key.

If you skip this step, the app still works — order confirmations, B2B acknowledgements etc. just get logged to the server console instead of actually emailed, which is fine for testing but not for a live store.

## 5. Set up payments (Razorpay)

1. Go to [dashboard.razorpay.com/signup](https://dashboard.razorpay.com/signup) → sign up free.
2. Start in **Test Mode** (default) — grab the **Key ID** and **Key Secret** from Settings → API Keys.
3. Under Settings → Webhooks, you'll add a webhook once your site has a real URL (step 7) pointing to `https://<your-domain>/api/webhooks/razorpay`, and copy the **Webhook Secret** it generates.
4. When you're ready to accept real money, complete Razorpay's KYC/activation to switch to **Live Mode** and swap in your live keys — there's no fee to do this, only per-transaction charges afterward.

## 6. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Sign up** with GitHub (free, no card).
2. **Add New → Project**, import your `sarya-pure` GitHub repo.
3. Before deploying, set the **Build Command** to:
   ```
   npm run vercel-build
   ```
   (This runs `prisma generate && prisma migrate deploy && next build` — it applies your database schema automatically on every deploy.)
4. Add every environment variable from `.env.example` under **Environment Variables**, filled in with your real values:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Neon pooled connection string |
   | `DIRECT_URL` | Neon direct connection string |
   | `AUTH_SECRET` | Generate with `openssl rand -base64 48` |
   | `NEXT_PUBLIC_SITE_URL` | Your future Vercel URL, e.g. `https://sarya-pure.vercel.app` (you can update this after the first deploy once you know the URL, then redeploy) |
   | `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | From step 5 |
   | `STORAGE_DRIVER` | `cloudinary` |
   | `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | From step 3 |
   | `SMTP_HOST` | `smtp-relay.brevo.com` |
   | `SMTP_PORT` | `587` |
   | `SMTP_USER` | Your Brevo SMTP login |
   | `SMTP_PASSWORD` | Your Brevo SMTP key |
   | `SMTP_SECURE` | `false` |
   | `EMAIL_FROM` | e.g. `Sarya Pure <orders@yourdomain.com>` (or your Brevo account email if you don't have a domain yet) |
   | `ADMIN_NOTIFICATION_EMAIL` | Where you want new-order/enquiry alerts sent |
   | `CRON_SECRET` | Generate with `openssl rand -base64 32` |

5. Click **Deploy**. First deploy takes a couple of minutes.
6. Once deployed, go back into **Environment Variables**, fix `NEXT_PUBLIC_SITE_URL` to your actual `*.vercel.app` URL (or custom domain), and **redeploy** (Deployments tab → ⋯ → Redeploy) so canonical URLs, the sitemap, and email links are correct.

## 7. Create your first admin account

Vercel's free tier has no shell access, so run the admin-creation script from your own machine, pointed at the production database:

```bash
DATABASE_URL="<your Neon pooled connection string>" \
ADMIN_EMAIL="you@yourcompany.com" \
ADMIN_PASSWORD="a-strong-password-12+chars" \
ADMIN_NAME="Your Name" \
npm run admin:create
```

Then sign in at `https://<your-domain>/login` and go to `/admin`.

## 8. Keep abandoned-cart stock release running every few minutes (important, free workaround)

The app releases stock reserved by unpaid online orders after their reservation window (30 minutes by default) via `/api/cron/release-reservations`. **Vercel's free Hobby plan only allows cron jobs to run once per day** — not frequently enough for this. `vercel.json` already includes a once-daily cron as a safety net, but for the app to behave as designed (releasing reserved stock within ~30 minutes, not up to 24 hours), add a free external pinger:

1. Go to [cron-job.org](https://cron-job.org) → sign up free.
2. Create a new cron job:
   - URL: `https://<your-domain>/api/cron/release-reservations`
   - Schedule: every 10–15 minutes
   - **Add header**: `Authorization: Bearer <your CRON_SECRET>`
3. Save. This single free external job is what actually keeps inventory reservations accurate in production.

## 9. Seed demo content (optional) and fill in real business details

If you want the demo catalog to explore the storefront immediately:

```bash
DATABASE_URL="<your Neon pooled connection string>" npm run db:seed
```

Then, as an admin, fill in the real business facts the app deliberately leaves blank (see the checklist at the bottom of `README.md`): company address, phone, GSTIN, FSSAI number, policy pages, and your live Razorpay keys before going live for real customers.

## 10. (Optional) Add a custom domain

Vercel → your project → **Settings → Domains** → add your domain and follow the DNS instructions (this part is free on Vercel regardless of plan; only the domain registration itself costs money, typically ₹500–1000/year from any registrar).

---

## Troubleshooting

- **"Too many attempts" on login/register while testing**: this is the app's built-in rate limiter (a real security feature, not a bug) — it resets automatically after the cooldown window shown in the message.
- **Product images broken after deploy**: confirm `STORAGE_DRIVER=cloudinary` and all three `CLOUDINARY_*` variables are set in Vercel — without them, uploaded images fail to persist on Vercel's serverless filesystem.
- **Emails not arriving**: check Vercel's function logs for the order/contact action; if `SMTP_HOST` is unset, emails are intentionally only logged, not sent — set the Brevo variables from step 4.
- **Cron/reservation questions**: confirm the `cron-job.org` job is enabled and its `Authorization` header exactly matches your `CRON_SECRET` value (case-sensitive, no extra spaces).
