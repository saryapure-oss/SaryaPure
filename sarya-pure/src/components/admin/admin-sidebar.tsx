"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  Boxes,
  ShoppingBag,
  Users,
  TicketPercent,
  Star,
  Briefcase,
  MessageSquare,
  Layers,
  Settings,
  Truck,
  ScrollText,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Mail,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import { can, type Permission } from "@/lib/auth/permissions";
import type { Role } from "@/generated/prisma/enums";

const items: { href: string; label: string; icon: typeof LayoutDashboard; permission?: Permission }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package, permission: "products:manage" },
  { href: "/admin/categories", label: "Categories", icon: Tags, permission: "products:manage" },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes, permission: "inventory:manage" },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, permission: "orders:manage" },
  { href: "/admin/customers", label: "Customers", icon: Users, permission: "customers:view" },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent, permission: "coupons:manage" },
  { href: "/admin/reviews", label: "Reviews", icon: Star, permission: "reviews:moderate" },
  { href: "/admin/b2b", label: "B2B Enquiries", icon: Briefcase, permission: "leads:manage" },
  { href: "/admin/messages", label: "Contact Messages", icon: MessageSquare, permission: "leads:manage" },
  { href: "/admin/cms", label: "Site Content", icon: Layers, permission: "cms:manage" },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail, permission: "leads:manage" },
  { href: "/admin/shipping", label: "Shipping Zones", icon: Truck, permission: "shipping:manage" },
  { href: "/admin/settings", label: "Settings", icon: Settings, permission: "settings:manage" },
  { href: "/admin/users", label: "Staff & Access", icon: ShieldCheck, permission: "users:manage" },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText, permission: "audit:view" },
];

export function AdminSidebar({ name, role }: { name: string; role: Role }) {
  const pathname = usePathname();
  const visible = items.filter((i) => !i.permission || can(role, i.permission));
  return (
    <nav aria-label="Admin" className="flex h-full flex-col border-r border-beige-300 bg-cream-50">
      <div className="border-b border-beige-300 p-5">
        <p className="font-serif text-lg font-semibold text-forest-900">Sarya Pure Admin</p>
        <p className="mt-0.5 truncate text-xs text-muted">
          {name} · {role}
        </p>
      </div>
      <ul className="flex-1 space-y-1 overflow-y-auto p-3">
        {visible.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link href={item.href} className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium", active ? "bg-forest-900 text-cream-50" : "hover:bg-beige-200")}>
                <item.icon className="h-4 w-4 shrink-0" aria-hidden /> {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="space-y-1 border-t border-beige-300 p-3">
        <Link href="/" target="_blank" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-beige-200">
          <ExternalLink className="h-4 w-4" aria-hidden /> View storefront
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50">
            <LogOut className="h-4 w-4" aria-hidden /> Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}

/** Compact horizontal nav for small screens, shown under the mobile admin header. */
export function AdminMobileNav({ name, role }: { name: string; role: Role }) {
  const pathname = usePathname();
  const visible = items.filter((i) => !i.permission || can(role, i.permission));
  return (
    <nav aria-label="Admin" className="mt-2 -mx-4 flex gap-1 overflow-x-auto px-4 pb-1">
      {visible.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn("shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium", active ? "bg-forest-900 text-cream-50" : "bg-beige-200 text-ink")}
          >
            {item.label}
          </Link>
        );
      })}
      <span className="sr-only">{name}</span>
    </nav>
  );
}
