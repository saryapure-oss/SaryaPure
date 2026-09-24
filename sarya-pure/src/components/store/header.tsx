import Link from "next/link";
import { Heart, ShoppingBag, User } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth/session";
import { getCartCount } from "@/lib/services/cart";
import { getPublishedCategories } from "@/lib/services/catalog";
import { isAdminRole } from "@/lib/auth/permissions";
import { whatsappLink } from "@/lib/utils";
import { Logo } from "./logo";
import { SearchBox } from "./search-box";
import { MobileMenu } from "./mobile-menu";
import { WhatsAppIcon } from "./whatsapp-icon";

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/gift-hampers", label: "Gift Hampers" },
  { href: "/b2b", label: "B2B" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export async function Header() {
  const [settings, user, cartCount, categories] = await Promise.all([getSettings(), getCurrentUser(), getCartCount(), getPublishedCategories()]);
  const { announcement, business } = settings;
  const wa = whatsappLink(business.whatsapp, "Hello Sarya Pure, I have a question.");

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-forest-900 focus:px-4 focus:py-2 focus:text-cream-50">
        Skip to content
      </a>
      {announcement.enabled && announcement.text && (
        <div className="bg-forest-950 text-cream-100">
          <p className="container-page flex min-h-9 flex-wrap items-center justify-center gap-x-3 py-1.5 text-center text-xs tracking-wide sm:text-sm">
            <span>{announcement.text}</span>
            {announcement.linkLabel && announcement.linkHref && (
              <Link href={announcement.linkHref} className="font-semibold text-gold-300 underline-offset-4 hover:underline">
                {announcement.linkLabel} →
              </Link>
            )}
          </p>
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-beige-300/70 bg-cream-100/95 backdrop-blur supports-[backdrop-filter]:bg-cream-100/85">
        <div className="container-page flex h-16 items-center gap-3 lg:h-20">
          <MobileMenu nav={NAV} categories={categories.map((c) => ({ name: c.name, slug: c.slug }))} isLoggedIn={Boolean(user)} whatsapp={wa} />
          <Logo name={business.brandName} logoUrl={business.logoUrl} />
          <nav aria-label="Main" className="ml-6 hidden items-center gap-1 lg:flex">
            {NAV.map((item) =>
              item.href === "/categories" ? (
                <div key={item.href} className="group relative">
                  <Link href="/categories" className="rounded-full px-3 py-2 text-sm font-medium text-ink hover:text-forest-700" aria-haspopup="true">
                    Categories
                  </Link>
                  <div className="invisible absolute left-0 top-full z-50 w-[28rem] translate-y-1 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    <ul className="card grid grid-cols-2 gap-1 p-3">
                      {categories.map((c) => (
                        <li key={c.id}>
                          <Link href={`/category/${c.slug}`} className="block rounded-lg px-3 py-2 text-sm hover:bg-beige-200">
                            {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <Link key={item.href} href={item.href} className="rounded-full px-3 py-2 text-sm font-medium text-ink hover:text-forest-700">
                  {item.label}
                </Link>
              ),
            )}
          </nav>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <SearchBox />
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="hidden h-10 w-10 items-center justify-center rounded-full text-forest-900 hover:bg-beige-200 md:inline-flex" aria-label="Chat with us on WhatsApp">
                <WhatsAppIcon className="h-5 w-5" />
              </a>
            )}
            <Link
              href={user ? (isAdminRole(user.role) ? "/account" : "/account") : "/login"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-forest-900 hover:bg-beige-200"
              aria-label={user ? "My account" : "Sign in"}
            >
              <User className="h-5 w-5" />
            </Link>
            <Link href="/wishlist" className="hidden h-10 w-10 items-center justify-center rounded-full text-forest-900 hover:bg-beige-200 sm:inline-flex" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
            </Link>
            <Link href="/cart" className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-forest-900 hover:bg-beige-200" aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}>
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1 text-[11px] font-bold text-forest-950" data-testid="cart-count">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
