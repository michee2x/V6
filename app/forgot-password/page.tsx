"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPassword } from "./actions";

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const success = searchParams.get("success");

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto pt-20">
      <div className="flex flex-col text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Reset password</h1>
        <p className="text-muted-foreground text-sm">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      {success ? (
        <div className="bg-emerald-500/15 text-emerald-600 p-4 rounded-md text-sm text-center">
          Check your email for the password reset link!
        </div>
      ) : (
        <form className="animate-in flex flex-col w-full justify-center gap-4 text-foreground">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <Button formAction={resetPassword} className="w-full">
            Send Reset Link
          </Button>
        </form>
      )}
    </div>
  );
}
