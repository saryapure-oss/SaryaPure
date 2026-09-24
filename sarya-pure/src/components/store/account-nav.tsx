"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Heart, MapPin, ShieldCheck, LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const items = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/security", label: "Password & Security", icon: ShieldCheck },
];

export function AccountNav({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="lg:sticky lg:top-28 lg:self-start">
      <div className="mb-4 hidden lg:block">
        <p className="font-semibold">{name}</p>
        <p className="truncate text-sm text-muted">{email}</p>
      </div>
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href} className="shrink-0">
              <Link href={item.href} className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium", active ? "bg-forest-900 text-cream-50" : "hover:bg-beige-200")}>
                <item.icon className="h-4 w-4" aria-hidden /> {item.label}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0 lg:mt-4 lg:border-t lg:border-beige-300 lg:pt-4">
          <form action={logoutAction}>
            <button type="submit" className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50">
              <LogOut className="h-4 w-4" aria-hidden /> Sign out
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
