import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "gold" | "ghost" | "danger" | "light";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 whitespace-nowrap";
const variants: Record<Variant, string> = {
  primary: "bg-forest-900 text-cream-50 hover:bg-forest-700",
  secondary: "border border-forest-900 text-forest-900 hover:bg-forest-900 hover:text-cream-50",
  gold: "bg-gold-500 text-forest-950 hover:bg-gold-400",
  ghost: "text-forest-900 hover:bg-beige-200",
  danger: "bg-red-700 text-white hover:bg-red-800",
  light: "bg-cream-50 text-forest-900 hover:bg-beige-200",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: { href: string; variant?: Variant; size?: Size; className?: string; children: React.ReactNode } & Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
>) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
