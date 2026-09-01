"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface WhitelabelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass the currently-logged-in user's info if available */
  user?: { name: string; email: string } | null;
}

export function WhitelabelModal({ open, onOpenChange, user }: WhitelabelModalProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    const data: Record<string, string | null> = {
      name: user ? user.name : (formData.get("name") as string),
      email: user ? user.email : (formData.get("email") as string),
      message: formData.get("message") as string,
      type: "whitelabel",
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to send enquiry");

      toast.success("Enquiry sent! We'll get back to you shortly.");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            {/* Whitelabel icon */}
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
              style={{
                background: "linear-gradient(135deg, oklch(0.65 0.2 280 / 0.15), oklch(0.65 0.2 340 / 0.15))",
                border: "1px solid oklch(0.65 0.2 280 / 0.3)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="oklch(0.65 0.2 280)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Whitelabel Enquiry</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                Tell us about your business and what you need.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          {/* Only show name/email fields for logged-out users */}
          {!user && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="wl-name">Your name</Label>
                <Input
                  id="wl-name"
                  name="name"
                  placeholder="Jane Smith"
                  required
                  autoComplete="name"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="wl-email">Work email</Label>
                <Input
                  id="wl-email"
                  name="email"
                  type="email"
                  placeholder="jane@yourcompany.com"
                  required
                  autoComplete="email"
                />
              </div>
            </>
          )}

          {/* Logged-in: show a small greeting */}
          {user && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/60 border border-border/50">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary uppercase">
                  {user.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground leading-tight">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="wl-message">
              Tell us about your whitelabel needs
            </Label>
            <Textarea
              id="wl-message"
              name="message"
              placeholder={`e.g. "We run a social media agency for 50+ clients and want to offer AI content recreation under our own brand. Looking for a custom plan with your API + our UI."`}
              rows={5}
              required
            />
            <p className="text-xs text-muted-foreground">
              Include your use case, expected volume, and any technical requirements.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="mt-1 font-semibold"
            style={{
              background: "linear-gradient(135deg, oklch(0.65 0.2 280), oklch(0.65 0.2 340))",
              color: "white",
            }}
          >
            {isLoading ? "Sending…" : "Send Enquiry"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
