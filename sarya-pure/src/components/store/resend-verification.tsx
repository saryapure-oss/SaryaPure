"use client";
import { useTransition } from "react";
import { resendVerificationEmail } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "./toast";

export function ResendVerification() {
  const [pending, start] = useTransition();
  const toast = useToast();
  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await resendVerificationEmail();
          toast(res.message ?? "Done.", res.ok ? "success" : "error");
        })
      }
    >
      Resend verification email
    </Button>
  );
}
