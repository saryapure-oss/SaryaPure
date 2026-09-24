"use client";
import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    // Server-side details are already redacted by Next.js in production (error.message is generic,
    // error.digest can be matched against server logs). Never show a stack trace to the user.
    console.error("[app-error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16 text-center">
      <TriangleAlert className="h-12 w-12 text-gold-500" aria-hidden />
      <h1 className="mt-6 text-4xl sm:text-5xl">Something went wrong</h1>
      <p className="mt-3 max-w-md text-muted">
        We&apos;re sorry, an unexpected error occurred. Please try again, or head back to the homepage.
        {error.digest && <span className="mt-1 block text-xs text-muted/70">Reference: {error.digest}</span>}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={() => retry()}>Try again</Button>
        <ButtonLink href="/" variant="secondary">
          Back to home
        </ButtonLink>
      </div>
    </div>
  );
}
