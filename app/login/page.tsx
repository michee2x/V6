import { login, signup } from "./actions";
import { Button } from "@/components/ui/button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Enter your email to sign in or create an account
          </p>
        </div>

        <form className="flex flex-col gap-4">
          {error && (
            <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 rounded-md">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="you@example.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <Button formAction={login} type="submit" className="w-full">
              Sign In
            </Button>
            <Button formAction={signup} type="submit" variant="outline" className="w-full">
              Sign Up
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
