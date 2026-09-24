// Generates the illustrated placeholder images in public/images.
// These are brand-styled illustrations meant to be replaced with real product photography via the admin panel.
// Run: node scripts/generate-placeholders.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const OUT = "public/images";
mkdirSync(`${OUT}/products`, { recursive: true });
mkdirSync(`${OUT}/categories`, { recursive: true });

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const r = (a, b) => a + rnd() * (b - a);

const shapes = {
  almond: (x, y, s, a) =>
    `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><path d="M0-34C16-22 20 6 12 22 6 32-6 32-12 22-20 6-16-22 0-34Z" fill="#a8683f"/><path d="M0-34C16-22 20 6 12 22 6 32-6 32-12 22-20 6-16-22 0-34Z" fill="url(#shine)"/><path d="M-4-18c2 10 2 24-1 34M5-14c1 9 1 18-1 28" stroke="#7d4a2a" stroke-width="1.6" fill="none" opacity=".55"/></g>`,
  cashew: (x, y, s, a) =>
    `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><path d="M-26-6C-30-26-6-36 12-28 30-20 30 8 16 22 6 32-12 30-10 18-8 8 6 8 8-4 10-16-8-18-12-6-14 2-22 6-26-6Z" fill="#ecd3a2"/><path d="M-26-6C-30-26-6-36 12-28 30-20 30 8 16 22" stroke="#d4b27a" stroke-width="2" fill="none"/></g>`,
  pistachio: (x, y, s, a) =>
    `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><ellipse rx="18" ry="26" fill="#e7d6b4"/><path d="M-4-24C-14-10-14 10-4 24" stroke="#c9b28a" stroke-width="2" fill="none"/><ellipse cx="4" rx="9" ry="19" fill="#7d9a3c"/><ellipse cx="6" cy="-4" rx="4" ry="9" fill="#9bb656" opacity=".8"/><path d="M4-19c3 6 3 30 0 38" stroke="#6b3f4d" stroke-width="2" fill="none" opacity=".5"/></g>`,
  walnut: (x, y, s, a) =>
    `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><path d="M-28-4c-4-18 10-30 24-26 6-8 22-6 26 6 12 4 12 22 2 28 2 14-14 20-24 14-10 8-26 2-26-10-10-2-8-10-2-12Z" fill="#c69a63"/><path d="M-18-10c6 4 10-4 16 2s8-6 16 0M-20 6c8 4 10-4 18 2s10-6 18 2M0-26v44" stroke="#9c7243" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`,
  raisin: (x, y, s, a) =>
    `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><path d="M-12-8C-8-16 8-16 12-8 16 2 10 14 0 14-10 14-16 2-12-8Z" fill="#3b2230"/><path d="M-6-6c4 3 8 3 12 0M-8 4c5 2 11 2 16-1" stroke="#5c3a4a" stroke-width="1.6" fill="none"/></g>`,
  date: (x, y, s, a) =>
    `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><ellipse rx="15" ry="30" fill="#5a2e1b"/><ellipse cx="-4" cy="-8" rx="4" ry="14" fill="#8a4a2c" opacity=".7"/><path d="M8-18c-3 8-3 22 0 32" stroke="#3e1f12" stroke-width="1.6" fill="none" opacity=".6"/></g>`,
  fig: (x, y, s, a) =>
    `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><path d="M0-30c8 0 10 6 12 10 14 6 20 18 16 30C22 26 10 32 0 32s-22-6-28-22c-4-12 2-24 16-30C-10-24-8-30 0-30Z" fill="#b98652"/><path d="M0-22v48M-14-10c6 10 6 26 2 34M14-10c-6 10-6 26-2 34" stroke="#94643a" stroke-width="1.8" fill="none" opacity=".7"/></g>`,
  apricot: (x, y, s, a) =>
    `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><ellipse rx="26" ry="22" fill="#e8913a"/><ellipse cx="-6" cy="-6" rx="10" ry="7" fill="#f4b06a" opacity=".8"/><path d="M-4-20c-4 12-4 28 2 40" stroke="#c46f22" stroke-width="2" fill="none" opacity=".6"/></g>`,
  pumpkinSeed: (x, y, s, a) =>
    `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><path d="M0-20C8-14 9 6 5 14 3 19-3 19-5 14-9 6-8-14 0-20Z" fill="#5f7d3a"/><path d="M0-16v28" stroke="#86a45a" stroke-width="1.5"/></g>`,
  sunflowerSeed: (x, y, s, a) =>
    `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><path d="M0-18C7-12 8 6 4 14 2 18-2 18-4 14-8 6-7-12 0-18Z" fill="#ddd2bd"/><path d="M-2-12v24M2-12v24" stroke="#8c8272" stroke-width="1.2"/></g>`,
  chia: (x, y, s) => `<circle cx="${x}" cy="${y}" r="${3 * s}" fill="#6b6259"/>`,
};

const defs = `<defs>
  <radialGradient id="bg" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="#fbf7ef"/><stop offset="1" stop-color="#ecdfc8"/></radialGradient>
  <linearGradient id="shine" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="bowl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e5a3e"/><stop offset="1" stop-color="#1f3d2b"/></linearGradient>
  <linearGradient id="gold" x1="0" x2="1"><stop offset="0" stop-color="#cfb26a"/><stop offset=".5" stop-color="#e2cd92"/><stop offset="1" stop-color="#b8923a"/></linearGradient>
</defs>`;

function pile(kinds, cx, cy, w, h, n, scale = 1) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = rnd();
    const x = cx + (rnd() - 0.5) * w * Math.sqrt(1 - Math.pow((t - 0.5) * 1.2, 2));
    const y = cy - rnd() * h + (Math.abs(x - cx) / w) * h * 0.9;
    const k = kinds[Math.floor(rnd() * kinds.length)];
    out.push(shapes[k](x.toFixed(1), y.toFixed(1), (r(0.8, 1.15) * scale).toFixed(2), Math.round(r(-80, 80))));
  }
  return out.join("");
}

function bowlScene(kinds, { w = 800, h = 800, count = 70, scale = 1 } = {}) {
  const cx = w / 2;
  const cy = h * 0.6;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${defs}
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <ellipse cx="${cx}" cy="${cy + 150}" rx="250" ry="34" fill="#1f3d2b" opacity=".12"/>
  <path d="M${cx - 250} ${cy}h500c0 110-110 170-250 170S${cx - 250} ${cy + 110} ${cx - 250} ${cy}Z" fill="url(#bowl)"/>
  <path d="M${cx - 250} ${cy}h500" stroke="url(#gold)" stroke-width="6" stroke-linecap="round"/>
  <g>${pile(kinds, cx, cy + 6, 440, 150, count, scale)}</g>
  <path d="M${cx - 236} ${cy + 8}c60 26 412 26 472 0" stroke="#cfb26a" stroke-width="2" fill="none" opacity=".5"/>
  ${pile(kinds, cx + 220, cy + 175, 120, 10, 5, scale * 0.9)}
</svg>`;
}

function hamperScene({ w = 800, h = 800 } = {}) {
  const cx = w / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${defs}
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <ellipse cx="${cx}" cy="640" rx="280" ry="30" fill="#1f3d2b" opacity=".14"/>
  <rect x="${cx - 260}" y="360" width="520" height="280" rx="18" fill="url(#bowl)"/>
  <rect x="${cx - 260}" y="360" width="520" height="280" rx="18" fill="none" stroke="url(#gold)" stroke-width="5"/>
  <g clip-path="inset(0)">${pile(["almond", "cashew", "pistachio", "date", "walnut", "fig"], cx, 360, 480, 110, 60)}</g>
  <rect x="${cx - 260}" y="430" width="520" height="210" rx="18" fill="url(#bowl)"/>
  <rect x="${cx - 18}" y="430" width="36" height="210" fill="url(#gold)"/>
  <rect x="${cx - 260}" y="515" width="520" height="30" fill="url(#gold)" opacity=".9"/>
  <path d="M${cx} 440c-60-70-150-40-110 10 20 24 80 10 110-10Zm0 0c60-70 150-40 110 10-20 24-80 10-110-10Z" fill="#e2cd92" stroke="#b8923a" stroke-width="3"/>
  <circle cx="${cx}" cy="440" r="16" fill="#b8923a"/>
  <text x="${cx}" y="600" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="#e2cd92" letter-spacing="6">SARYA PURE</text>
</svg>`;
}

const scenes = {
  almonds: () => bowlScene(["almond"], { count: 80 }),
  cashews: () => bowlScene(["cashew"], { count: 60 }),
  pistachios: () => bowlScene(["pistachio"], { count: 70 }),
  walnuts: () => bowlScene(["walnut"], { count: 40 }),
  raisins: () => bowlScene(["raisin"], { count: 150, scale: 1.1 }),
  dates: () => bowlScene(["date"], { count: 55 }),
  figs: () => bowlScene(["fig"], { count: 32 }),
  apricots: () => bowlScene(["apricot"], { count: 38 }),
  seeds: () => bowlScene(["pumpkinSeed", "sunflowerSeed", "chia", "chia"], { count: 220, scale: 1 }),
  "mixed-dry-fruits": () => bowlScene(["almond", "cashew", "pistachio", "raisin", "walnut", "apricot"], { count: 75 }),
  "roasted-nuts": () => bowlScene(["almond", "cashew", "pistachio"], { count: 75 }),
  "healthy-snacks": () => bowlScene(["pumpkinSeed", "raisin", "almond", "sunflowerSeed", "cashew"], { count: 110 }),
  "gift-hampers": () => hamperScene(),
};

for (const [name, fn] of Object.entries(scenes)) {
  const svg = fn();
  writeFileSync(`${OUT}/categories/${name}.svg`, svg);
  writeFileSync(`${OUT}/products/${name}.svg`, svg);
}

// Secondary product "detail" angle (tighter crop) for galleries
for (const name of ["almonds", "cashews", "pistachios", "walnuts", "raisins", "dates", "figs", "mixed-dry-fruits", "roasted-nuts"]) {
  seed = name.length * 97;
  const kinds = { almonds: ["almond"], cashews: ["cashew"], pistachios: ["pistachio"], walnuts: ["walnut"], raisins: ["raisin"], dates: ["date"], figs: ["fig"], "mixed-dry-fruits": ["almond", "cashew", "raisin", "pistachio"], "roasted-nuts": ["almond", "cashew", "pistachio"] }[name];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">${defs}<rect width="800" height="800" fill="#f5eee1"/>${pile(kinds, 400, 760, 900, 760, 170, 1.6)}</svg>`;
  writeFileSync(`${OUT}/products/${name}-detail.svg`, svg);
}

// Hero
seed = 42;
const hero = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 900" width="1000" height="900">${defs}
<rect width="1000" height="900" fill="url(#bg)"/>
<circle cx="520" cy="420" r="330" fill="#efe4d2"/>
<circle cx="520" cy="420" r="330" fill="none" stroke="#cfb26a" stroke-width="2" stroke-dasharray="2 10" opacity=".8"/>
<ellipse cx="500" cy="760" rx="300" ry="36" fill="#1f3d2b" opacity=".12"/>
<path d="M220 520h560c0 140-130 220-280 220S220 660 220 520Z" fill="url(#bowl)"/>
<path d="M220 520h560" stroke="url(#gold)" stroke-width="7" stroke-linecap="round"/>
<g>${pile(["almond", "cashew", "pistachio", "walnut", "date", "apricot", "raisin"], 500, 528, 500, 190, 95, 1.05)}</g>
<g>${pile(["almond", "pistachio", "cashew", "date"], 150, 800, 140, 20, 6)}${pile(["walnut", "fig", "apricot"], 860, 780, 150, 20, 5)}</g>
</svg>`;
writeFileSync(`${OUT}/hero.svg`, hero);

seed = 99;
const about = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">${defs}<rect width="800" height="600" fill="#1f3d2b"/>
<circle cx="400" cy="300" r="220" fill="#264a34"/><circle cx="400" cy="300" r="220" fill="none" stroke="#cfb26a" stroke-width="2" opacity=".6"/>
<g>${pile(["almond", "cashew", "pistachio", "date", "fig"], 400, 420, 380, 260, 70, 1.1)}</g></svg>`;
writeFileSync(`${OUT}/about.svg`, about);

// Open Graph default image (PNG — social networks do not render SVG)
const og = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">${defs}
<rect width="1200" height="630" fill="#1f3d2b"/>
<text x="80" y="250" font-family="Georgia,serif" font-size="84" fill="#fbf7ef">Sarya Pure</text>
<rect x="80" y="285" width="120" height="3" fill="#cfb26a"/>
<text x="80" y="360" font-family="Georgia,serif" font-size="44" fill="#e2cd92">Pure Goodness. Naturally Premium.</text>
<text x="80" y="430" font-family="Arial,sans-serif" font-size="26" fill="#dfe9e1">Premium dry fruits, nuts, seeds &amp; gift hampers</text>
<g>${pile(["almond", "cashew", "pistachio", "date"], 980, 560, 360, 300, 60, 1.2)}</g></svg>`;
await sharp(Buffer.from(og)).png().toFile(`${OUT}/og-default.png`);
console.log("placeholders generated");
