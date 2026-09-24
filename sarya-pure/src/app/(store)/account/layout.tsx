import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { AccountNav } from "@/components/store/account-nav";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata: Metadata = { title: "My Account", robots: { index: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/account");
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "My Account" }]} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl sm:text-5xl">My Account</h1>
        {!user.emailVerified && (
          <Link href="/account/security" className="rounded-full bg-gold-300/40 px-4 py-2 text-sm font-semibold text-brown-700">
            Verify your email →
          </Link>
        )}
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <AccountNav name={user.name} email={user.email} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
