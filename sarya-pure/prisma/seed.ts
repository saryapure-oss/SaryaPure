/**
 * Development / demo seed data.
 * EVERYTHING created here is demo content (products are flagged isDemo, testimonials isDemo, policies isPlaceholder).
 * Prices and stock levels are illustrative only. No business facts (address, GSTIN, FSSAI, phone...) are created.
 * Run: npm run db:seed
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const rs = (rupees: number) => Math.round(rupees * 100);

const categories = [
  ["Almonds", "almonds", "Crunchy, wholesome almonds for everyday snacking and cooking."],
  ["Cashews", "cashews", "Creamy, buttery cashews — whole, premium grades."],
  ["Pistachios", "pistachios", "Roasted and salted pistachios, perfect for snacking."],
  ["Walnuts", "walnuts", "Light, crunchy walnut kernels and in-shell walnuts."],
  ["Raisins", "raisins", "Naturally sweet golden and black raisins."],
  ["Dates", "dates", "Soft, rich dates for natural sweetness."],
  ["Figs", "figs", "Dried figs (anjeer) with a delicate crunch of seeds."],
  ["Apricots", "apricots", "Sun-dried apricots with a sweet-tart flavour."],
  ["Seeds", "seeds", "Pumpkin, sunflower, chia, flax and more."],
  ["Mixed Dry Fruits", "mixed-dry-fruits", "Balanced mixes of our favourite nuts and dried fruits."],
  ["Roasted Nuts", "roasted-nuts", "Lightly roasted and seasoned nuts."],
  ["Healthy Snacks", "healthy-snacks", "Trail mixes and wholesome everyday snacks."],
  ["Gift Hampers", "gift-hampers", "Premium gift boxes for festivals, weddings and corporate gifting."],
] as const;

type SeedProduct = {
  name: string;
  slug: string;
  sku: string;
  category: string;
  image: string;
  detailImage?: boolean;
  tags: string[];
  short: string;
  description: string;
  ingredients: string;
  allergens: string;
  basePrice100g: number; // rupees, demo
  mrpFactor?: number;
  weights?: number[];
  featured?: boolean;
  bestSeller?: boolean;
  taxRate?: number;
};

const STORAGE = "Store in an airtight container in a cool, dry place away from direct sunlight. Refrigerate after opening in hot or humid weather.";
const SHIPPING = "Dispatched in sealed packaging. Estimated delivery time is shown at checkout based on your PIN code.";

const products: SeedProduct[] = [
  {
    name: "Premium California Almonds",
    slug: "premium-california-almonds",
    sku: "SP-ALM-CAL",
    category: "almonds",
    image: "almonds",
    detailImage: true,
    tags: ["almonds", "badam", "california", "protein", "snack"],
    short: "Crunchy, naturally sweet California almonds — a versatile everyday essential.",
    description:
      "Our Premium California Almonds are selected for their uniform size, rich colour and satisfying crunch.\n\nEnjoy them raw, soaked overnight, roasted, or added to breakfast bowls, smoothies and desserts.",
    ingredients: "Almonds",
    allergens: "Contains tree nuts (almonds).",
    basePrice100g: 129,
    featured: true,
    bestSeller: true,
  },
  {
    name: "Jumbo Cashews",
    slug: "jumbo-cashews",
    sku: "SP-CSH-JMB",
    category: "cashews",
    image: "cashews",
    detailImage: true,
    tags: ["cashews", "kaju", "jumbo", "w240"],
    short: "Large, creamy whole cashews with a rich, buttery taste.",
    description: "Big, whole and creamy — our Jumbo Cashews are perfect for gifting, festive sweets, gravies or simply snacking.",
    ingredients: "Cashew kernels",
    allergens: "Contains tree nuts (cashews).",
    basePrice100g: 149,
    featured: true,
    bestSeller: true,
  },
  {
    name: "Roasted Pistachios",
    slug: "roasted-pistachios",
    sku: "SP-PST-RST",
    category: "pistachios",
    image: "pistachios",
    detailImage: true,
    tags: ["pistachios", "pista", "roasted", "salted"],
    short: "Lightly roasted, lightly salted in-shell pistachios.",
    description: "Roasted to bring out their natural flavour and lightly salted, these pistachios make a delicious anytime snack.",
    ingredients: "Pistachios, salt",
    allergens: "Contains tree nuts (pistachios).",
    basePrice100g: 179,
    featured: true,
  },
  {
    name: "Premium Walnuts",
    slug: "premium-walnuts",
    sku: "SP-WAL-PRM",
    category: "walnuts",
    image: "walnuts",
    detailImage: true,
    tags: ["walnuts", "akhrot", "kernels"],
    short: "Light, crunchy walnut kernels with a mild, pleasant taste.",
    description: "Premium walnut kernels, carefully packed to protect their delicate texture. Add to salads, oats, baking or enjoy by the handful.",
    ingredients: "Walnut kernels",
    allergens: "Contains tree nuts (walnuts).",
    basePrice100g: 169,
    bestSeller: true,
  },
  {
    name: "Black Raisins",
    slug: "black-raisins",
    sku: "SP-RSN-BLK",
    category: "raisins",
    image: "raisins",
    detailImage: true,
    tags: ["raisins", "kishmish", "black raisins", "munakka"],
    short: "Naturally sweet, plump black raisins.",
    description: "Soft, chewy and naturally sweet black raisins — lovely soaked overnight, in kheer, halwa or trail mixes.",
    ingredients: "Black raisins",
    allergens: "No major allergens declared. Please check the pack label.",
    basePrice100g: 69,
  },
  {
    name: "Premium Dates",
    slug: "premium-dates",
    sku: "SP-DAT-PRM",
    category: "dates",
    image: "dates",
    detailImage: true,
    tags: ["dates", "khajur", "natural sweetener"],
    short: "Soft, rich dates with a caramel-like sweetness.",
    description: "Our Premium Dates are soft and rich — a naturally sweet treat on their own, stuffed with nuts, or blended into smoothies.",
    ingredients: "Dates",
    allergens: "No major allergens declared. Please check the pack label.",
    basePrice100g: 89,
    featured: true,
  },
  {
    name: "Turkish Figs",
    slug: "turkish-figs",
    sku: "SP-FIG-TRK",
    category: "figs",
    image: "figs",
    detailImage: true,
    tags: ["figs", "anjeer", "turkish"],
    short: "Soft dried figs with a delicate crunch of seeds.",
    description: "Tender dried figs with natural sweetness and a pleasing texture. Enjoy them soaked, chopped into desserts or with cheese.",
    ingredients: "Dried figs",
    allergens: "No major allergens declared. Please check the pack label.",
    basePrice100g: 199,
  },
  {
    name: "Premium Mixed Dry Fruits",
    slug: "premium-mixed-dry-fruits",
    sku: "SP-MIX-PRM",
    category: "mixed-dry-fruits",
    image: "mixed-dry-fruits",
    detailImage: true,
    tags: ["mixed dry fruits", "mix", "almonds", "cashews", "raisins"],
    short: "A balanced mix of almonds, cashews, pistachios, raisins and apricots.",
    description: "The best of our range in one pack — convenient for daily snacking, lunch boxes and guests.",
    ingredients: "Almonds, cashews, pistachios, raisins, apricots",
    allergens: "Contains tree nuts (almonds, cashews, pistachios).",
    basePrice100g: 159,
    featured: true,
    bestSeller: true,
  },
  {
    name: "Roasted Nut Mix",
    slug: "roasted-nut-mix",
    sku: "SP-RNM-001",
    category: "roasted-nuts",
    image: "roasted-nuts",
    detailImage: true,
    tags: ["roasted", "nut mix", "snack", "salted"],
    short: "Lightly roasted almonds, cashews and pistachios with a pinch of salt.",
    description: "A savoury, crunchy mix for tea-time and travel. Lightly roasted for flavour.",
    ingredients: "Almonds, cashews, pistachios, salt",
    allergens: "Contains tree nuts (almonds, cashews, pistachios).",
    basePrice100g: 149,
  },
  {
    name: "Sun-dried Apricots",
    slug: "sun-dried-apricots",
    sku: "SP-APR-SUN",
    category: "apricots",
    image: "apricots",
    tags: ["apricots", "khumani", "dried fruit"],
    short: "Sweet-tart dried apricots.",
    description: "Chewy dried apricots with a bright sweet-tart flavour — great for snacking, baking and salads.",
    ingredients: "Dried apricots",
    allergens: "No major allergens declared. Please check the pack label.",
    basePrice100g: 119,
  },
  {
    name: "Seed Mix",
    slug: "seed-mix",
    sku: "SP-SED-MIX",
    category: "seeds",
    image: "seeds",
    tags: ["seeds", "pumpkin", "sunflower", "chia", "flax"],
    short: "Pumpkin, sunflower, chia and flax seeds in one convenient pack.",
    description: "Sprinkle over smoothie bowls, salads, oats and yoghurt for added crunch.",
    ingredients: "Pumpkin seeds, sunflower seeds, chia seeds, flax seeds",
    allergens: "No major allergens declared. Please check the pack label.",
    basePrice100g: 99,
    weights: [100, 250, 500],
  },
  {
    name: "Everyday Trail Mix",
    slug: "everyday-trail-mix",
    sku: "SP-SNK-TRL",
    category: "healthy-snacks",
    image: "healthy-snacks",
    tags: ["trail mix", "snack", "seeds", "raisins"],
    short: "Seeds, nuts and raisins for on-the-go snacking.",
    description: "A handy, wholesome mix for your desk, bag or car.",
    ingredients: "Almonds, cashews, pumpkin seeds, sunflower seeds, raisins",
    allergens: "Contains tree nuts (almonds, cashews).",
    basePrice100g: 109,
    weights: [100, 250],
  },
];

const PRICE_SCALE: Record<number, number> = { 100: 1, 250: 2.4, 500: 4.6, 1000: 8.8 };

const policies = [
  ["privacy-policy", "Privacy Policy"],
  ["terms-and-conditions", "Terms & Conditions"],
  ["shipping-policy", "Shipping Policy"],
  ["return-refund-policy", "Return & Refund Policy"],
  ["cancellation-policy", "Cancellation Policy"],
  ["cookie-policy", "Cookie Policy"],
] as const;

function policyPlaceholder(title: string): string {
  return `> **Placeholder content — must be reviewed and replaced by Sarya Pure Pvt Ltd (and a qualified legal professional) before the website goes live.**

## Overview
This ${title} explains how Sarya Pure Pvt Ltd ("we", "us") handles this topic for orders placed on this website. Replace this text with your approved policy.

## Points to cover
- Scope and applicability
- Timelines and conditions
- How customers can contact us about this policy
- Governing law and jurisdiction (India)

## Contact
For questions about this policy, please use the [Contact page](/contact).

_Last updated: to be confirmed._`;
}

async function main() {
  console.log("Seeding demo data…");

  for (const [i, [name, slug, description]] of categories.entries()) {
    await db.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug, description, image: `/images/categories/${slug}.svg`, sortOrder: i, isPublished: true, showOnHome: true },
    });
  }
  const cats = Object.fromEntries((await db.category.findMany()).map((c) => [c.slug, c.id]));

  for (const p of products) {
    const weights = p.weights ?? [100, 250, 500, 1000];
    const exists = await db.product.findUnique({ where: { slug: p.slug } });
    if (exists) continue;
    const product = await db.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        categoryId: cats[p.category]!,
        tags: p.tags,
        shortDescription: p.short,
        description: p.description,
        ingredients: p.ingredients,
        allergens: p.allergens,
        nutritionInfo: null, // Never invented — add from the actual product label in admin.
        storageInstructions: STORAGE,
        shippingInfo: SHIPPING,
        taxRate: new Prisma.Decimal(p.taxRate ?? 5),
        isPublished: true,
        isFeatured: Boolean(p.featured),
        isBestSeller: Boolean(p.bestSeller),
        isDemo: true,
        seoTitle: `${p.name} — Buy Online`,
        seoDescription: p.short,
        images: {
          create: [
            { url: `/images/products/${p.image}.svg`, alt: `${p.name} (illustration)`, sortOrder: 0 },
            ...(p.detailImage ? [{ url: `/images/products/${p.image}-detail.svg`, alt: `${p.name} close-up (illustration)`, sortOrder: 1 }] : []),
          ],
        },
        variants: {
          create: weights.map((w, idx) => {
            const price = rs(Math.round(p.basePrice100g * PRICE_SCALE[w]!));
            return {
              sku: `${p.sku}-${w >= 1000 ? `${w / 1000}KG` : `${w}G`}`,
              name: w >= 1000 ? `${w / 1000} kg` : `${w} g`,
              weightGrams: w,
              price,
              mrp: Math.round((price * (p.mrpFactor ?? 1.2)) / 100) * 100,
              isDefault: w === 250 || (w === weights[0] && !weights.includes(250)),
              sortOrder: idx,
              inventory: { create: { stock: w >= 1000 ? 25 : 60, lowStockThreshold: 10 } },
            };
          }),
        },
      },
    });
    await refreshAggregates(product.id);
  }

  // Gift hamper: sold as a product with a single variant, composed of other variants.
  if (!(await db.product.findUnique({ where: { slug: "premium-dry-fruit-gift-box" } }))) {
    const pick = async (sku: string) => (await db.productVariant.findUniqueOrThrow({ where: { sku } })).id;
    const hamper = await db.product.create({
      data: {
        name: "Premium Dry Fruit Gift Box",
        slug: "premium-dry-fruit-gift-box",
        sku: "SP-GFT-PRM",
        categoryId: cats["gift-hampers"]!,
        tags: ["gift", "hamper", "diwali", "corporate", "wedding"],
        shortDescription: "An elegant gift box with almonds, cashews, pistachios and dates.",
        description:
          "A beautifully presented gift box featuring four of our favourites. Ideal for festivals, weddings, thank-you gifts and corporate gifting. Add a personal gift message at checkout.",
        ingredients: "Almonds, cashews, pistachios, dates",
        allergens: "Contains tree nuts (almonds, cashews, pistachios).",
        storageInstructions: STORAGE,
        shippingInfo: SHIPPING,
        taxRate: new Prisma.Decimal(5),
        isPublished: true,
        isFeatured: true,
        isDemo: true,
        images: { create: [{ url: "/images/products/gift-hampers.svg", alt: "Premium Dry Fruit Gift Box (illustration)" }] },
        variants: {
          create: [{ sku: "SP-GFT-PRM-STD", name: "Gift Box (4 × 250 g)", price: rs(1499), mrp: rs(1799), isDefault: true, inventory: { create: { stock: 30, lowStockThreshold: 5 } } }],
        },
        giftBox: {
          create: {
            type: "PREMIUM",
            items: {
              create: [
                { variantId: await pick("SP-ALM-CAL-250G"), quantity: 1 },
                { variantId: await pick("SP-CSH-JMB-250G"), quantity: 1 },
                { variantId: await pick("SP-PST-RST-250G"), quantity: 1 },
                { variantId: await pick("SP-DAT-PRM-250G"), quantity: 1 },
              ],
            },
          },
        },
      },
    });
    await refreshAggregates(hamper.id);
  }

  const coupons = [
    { code: "WELCOME10", description: "DEMO: 10% off your first order (max ₹200) on orders above ₹499", type: "PERCENTAGE" as const, value: 10, minOrderAmount: rs(499), maxDiscount: rs(200), perUserLimit: 1 },
    { code: "FLAT100", description: "DEMO: ₹100 off on orders above ₹999", type: "FIXED" as const, value: rs(100), minOrderAmount: rs(999), maxDiscount: null, perUserLimit: null },
  ];
  for (const c of coupons) await db.coupon.upsert({ where: { code: c.code }, update: {}, create: c });
  if (!(await db.coupon.findUnique({ where: { code: "NUTS15" } }))) {
    await db.coupon.create({
      data: {
        code: "NUTS15",
        description: "DEMO: 15% off almonds & cashews",
        type: "PERCENTAGE",
        value: 15,
        scope: "CATEGORIES",
        categories: { connect: [{ id: cats["almonds"]! }, { id: cats["cashews"]! }] },
      },
    });
  }

  if ((await db.fAQ.count()) === 0) {
    const faqs = [
      ["Ordering", "How do I place an order?", "Browse the shop, choose a pack size, add items to your cart and proceed to checkout. You'll need to sign in or create an account to complete your order."],
      ["Payments", "Which payment methods are accepted?", "Online payments are processed securely by Razorpay (UPI, cards, net banking and wallets). Cash on Delivery is available for eligible orders and PIN codes."],
      ["Shipping", "How long will delivery take?", "An estimated delivery time is shown at checkout based on your PIN code. You can follow your order's progress from your account or the Track Order page."],
      ["Shipping", "Do you offer free shipping?", "Yes — orders above the free-shipping threshold shown in your cart ship free. The current threshold is always displayed in the cart."],
      ["Orders", "Can I cancel my order?", "You can cancel from your account before the order is packed. Please see our Cancellation Policy for details."],
      ["Products", "How should I store dry fruits?", "Keep them in an airtight container in a cool, dry place away from sunlight. In hot or humid weather, refrigeration helps preserve freshness."],
      ["Business", "Do you supply in bulk?", "Yes. Retailers, wholesalers, hotels, cafés and corporate customers can send a bulk enquiry through our B2B page."],
    ];
    for (const [i, [category, question, answer]] of faqs.entries()) {
      await db.fAQ.create({ data: { category, question, answer, sortOrder: i, showOnHome: i < 5 } });
    }
  }

  if ((await db.testimonial.count()) === 0) {
    const demo = [
      ["Demo Customer A", "Sample city", "This is sample testimonial text shown for layout purposes only. Replace with real, approved customer feedback."],
      ["Demo Customer B", "Sample city", "Demo content — publish genuine customer reviews from the admin panel before launch."],
      ["Demo Customer C", "Sample city", "Placeholder testimonial. Real testimonials should only be added with the customer's consent."],
    ];
    for (const [i, [name, location, content]] of demo.entries()) {
      await db.testimonial.create({ data: { name, location, content, rating: 5, isDemo: true, isPublished: true, sortOrder: i } });
    }
  }

  for (const [slug, title] of policies) {
    await db.policyPage.upsert({ where: { slug }, update: {}, create: { slug, title, content: policyPlaceholder(title), isPlaceholder: true } });
  }

  if ((await db.banner.count()) === 0) {
    await db.banner.create({
      data: {
        title: "Gifting, made thoughtful",
        subtitle: "Premium dry fruit hampers for festivals, weddings and corporate occasions.",
        image: "/images/products/gift-hampers.svg",
        link: "/gift-hampers",
        ctaLabel: "Explore Gift Hampers",
        placement: "HOME_PROMO",
      },
    });
  }

  console.log("Seed complete. All products/testimonials are flagged as DEMO content.");
}

async function refreshAggregates(productId: string) {
  const variants = await db.productVariant.findMany({ where: { productId, isActive: true }, include: { inventory: true } });
  await db.product.update({
    where: { id: productId },
    data: {
      minPrice: Math.min(...variants.map((v) => v.price)),
      maxDiscountPct: Math.max(0, ...variants.map((v) => Math.round(((v.mrp - v.price) / v.mrp) * 100))),
      inStock: variants.some((v) => (v.inventory?.stock ?? 0) > 0),
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
