"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePassword } from "./actions";

export default function UpdatePasswordPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto pt-20">
      <div className="flex flex-col text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Create new password</h1>
        <p className="text-muted-foreground text-sm">
          Your new password must be at least 6 characters long.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      <form className="animate-in flex flex-col w-full justify-center gap-4 text-foreground">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="password">
            New Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>

        <Button formAction={updatePassword} className="w-full mt-2">
          Update Password
        </Button>
      </form>
    </div>
  );
}
