import Link from "next/link";
import { verifyEmailToken } from "@/app/actions/auth";
import { CheckCircle2, XCircle } from "lucide-react";

export const metadata = { title: "Verify Email", robots: { index: false } };

export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const { token } = await searchParams;
  const t = typeof token === "string" ? token : "";
  const result = t ? await verifyEmailToken(t) : { ok: false, message: "No verification token was provided." };
  return (
    <div className="text-center">
      {result.ok ? <CheckCircle2 className="mx-auto h-12 w-12 text-forest-700" aria-hidden /> : <XCircle className="mx-auto h-12 w-12 text-red-700" aria-hidden />}
      <h1 className="mt-4 text-3xl">{result.ok ? "Email verified" : "Verification failed"}</h1>
      <p className="mt-2 text-muted">{result.message}</p>
      <Link href="/account" className="mt-6 inline-block font-semibold text-forest-800 underline">
        Go to my account
      </Link>
    </div>
  );
}
