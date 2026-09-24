import Link from "next/link";
import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16 text-center">
      <SearchX className="h-12 w-12 text-gold-500" aria-hidden />
      <h1 className="mt-6 text-4xl sm:text-5xl">Page not found</h1>
      <p className="mt-3 max-w-md text-muted">The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s get you back to shopping.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Back to home</ButtonLink>
        <ButtonLink href="/shop" variant="secondary">
          Shop all products
        </ButtonLink>
      </div>
      <p className="mt-8 text-sm text-muted">
        Need help?{" "}
        <Link href="/contact" className="font-medium text-forest-800 hover:underline">
          Contact us
        </Link>
      </p>
    </div>
  );
}
