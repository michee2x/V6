"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import ReCAPTCHA from "react-google-recaptcha";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { login, signup } from "@/app/login/actions";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4">
      <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
        <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
        <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
        <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
        <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
      </g>
    </svg>
  );
}

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const captchaRef = useRef<ReCAPTCHA | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const isLocalhost = typeof window !== "undefined" && window.location.hostname.includes("localhost");
  const recaptchaSiteKey = isLocalhost
    ? process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY_LOCALHOST
    : process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    const errorMsg = searchParams.get("error");
    const messageMsg = searchParams.get("message");
    const verified = searchParams.get("verified");
    const isNewSignup = searchParams.get("newsignup") === "true";

    if (isNewSignup) {
      toast.success("Account created successfully! Please check your email to verify your account.");
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("newsignup");
      window.history.replaceState({}, "", newUrl.toString());
    }

    if (errorMsg) {
      toast.error(errorMsg);
      // Clean up the URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      window.history.replaceState({}, "", newUrl.toString());
    }

    if (messageMsg) {
      toast.info(messageMsg);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("message");
      window.history.replaceState({}, "", newUrl.toString());
    }

    if (verified === "true") {
      toast.success("Account successfully verified! You can now log in.");
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("verified");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Could not sign in with Google");
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>, action: "login" | "signup") => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      toast.error("Please provide both email and password.");
      setIsLoading(false);
      return;
    }

    if (action === "signup") {
      if (recaptchaSiteKey && !captchaToken) {
        toast.error("Please complete the captcha verification.");
        setIsLoading(false);
        return;
      }
      if (captchaToken) {
        formData.append("captchaToken", captchaToken);
      }
    }

    try {
      // In next.js app router server actions can be invoked directly from client components.
      if (action === "login") {
        await login(formData);
      } else {
        await signup(formData);
      }
    } catch (err: any) {
      // Next.js redirect() throws a specific error that we shouldn't catch and swallow normally,
      // but when calling it from a client form, it might be safer to let the redirect happen 
      // or rely on server action returning state. Wait, redirect in server action throws `NEXT_REDIRECT`.
      // It's handled by Next.js automatically if we await it.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Sign in to your account or create a new one
        </p>
      </div>

      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="space-y-4 mt-4">
          <div className="bg-green-50 text-green-800 text-sm p-4 rounded-md border border-green-200 mb-4 hidden [&:has(+_form_input:placeholder-shown)]:block" id="new-signup-banner" style={{ display: searchParams.get("newsignup") === "true" ? "block" : "none" }}>
            <strong>Action Required:</strong> Please check your email and click the verification link before logging in.
          </div>
          <form onSubmit={(e) => handleEmailAuth(e, "login")} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  name="password"
                  type={showLoginPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  aria-label={showLoginPassword ? "Hide password" : "Show password"}
                >
                  {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign In
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup" className="space-y-4 mt-4">
          <form onSubmit={(e) => handleEmailAuth(e, "signup")} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="signup-password">Password</Label>
              <div className="relative">
                <Input
                  id="signup-password"
                  name="password"
                  type={showSignupPassword ? "text" : "password"}
                  required
                  placeholder="Create a strong password"
                  minLength={8}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  aria-label={showSignupPassword ? "Hide password" : "Show password"}
                >
                  {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {recaptchaSiteKey && (
              <div className="flex justify-center my-2">
                <ReCAPTCHA
                  ref={captchaRef}
                  sitekey={recaptchaSiteKey}
                  onChange={(token) => setCaptchaToken(token)}
                  theme="light"
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || (!!recaptchaSiteKey && !captchaToken)}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Account
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        type="button"
        className="w-full"
        disabled={isLoading}
        onClick={handleGoogleSignIn}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Google
      </Button>
    </div>
  );
}
