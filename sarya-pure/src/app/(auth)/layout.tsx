import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { Logo } from "@/components/store/logo";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { business, hero } = await getSettings();
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col justify-between bg-forest-950 p-8 text-cream-100 lg:p-14">
        <Logo name={business.brandName} logoUrl={business.logoUrl} light />
        <div className="my-12 max-w-md">
          <p className="eyebrow text-gold-300">{hero.eyebrow || business.brandName}</p>
          <h1 className="mt-3 text-4xl text-cream-50 lg:text-5xl">{hero.headline}</h1>
          <p className="mt-4 text-cream-100/80">{hero.description}</p>
        </div>
        <p className="text-sm text-cream-100/60">
          <Link href="/" className="hover:underline">
            ← Back to shopping
          </Link>
        </p>
      </div>
      <div className="flex items-center justify-center p-6 py-14 sm:p-14">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
