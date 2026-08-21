"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyEmailAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const [isLoading, setIsLoading] = useState(false);

  if (!code) {
    return (
      <div className="w-full max-w-md p-8 bg-white border rounded-xl shadow-sm text-center">
        <h1 className="text-xl font-semibold text-red-600 mb-2">Invalid Link</h1>
        <p className="text-muted-foreground text-sm">
          No verification code was found in the URL.
        </p>
      </div>
    );
  }

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      await verifyEmailAction(code, next);
    } catch (err: any) {
      // Next.js redirects throw a specific error which we should not swallow
      if (!(err && typeof err === 'object' && 'digest' in err && (err as any).digest.startsWith('NEXT_REDIRECT'))) {
        toast.error("Failed to verify. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white border rounded-xl shadow-sm text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
        <MailCheck className="h-6 w-6 text-green-600" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Verify Your Email</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Click the button below to verify your email address and activate your account. 
        This extra step ensures that email scanners don't accidentally expire your link.
      </p>
      <Button onClick={handleVerify} className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Verify My Account
      </Button>
    </div>
  );
}
