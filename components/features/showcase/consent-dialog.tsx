"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";

interface ConsentDialogProps {
  sessionId: string;
}

export function ConsentDialog({ sessionId }: ConsentDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // Auto-open after a short delay so the user sees their brief first
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setOpen(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleConsent = async (agreed: boolean) => {
    setIsLoading(true);
    try {
      if (agreed) {
        const res = await fetch(`/api/v1/sessions/${sessionId}/consent`, {
          method: "PATCH",
        });
        if (!res.ok) throw new Error("Failed to save consent");
        toast.success("Thanks for sharing! You're helping the community grow.", {
          icon: <Heart className="w-4 h-4 text-pink-500" />
        });
      }
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong, but thanks anyway!");
      setOpen(false); // Close it anyway so it's not annoying
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Can we use your result as an example?</DialogTitle>
          <DialogDescription className="text-center pt-2">
            Help other creators discover Recrea8 by letting us show your brief (anonymously) as a sample in our Inspiration Gallery.
            <br /><br />
            <strong>Your source link is never shown.</strong>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-col gap-2 mt-4 sm:space-x-0">
          <Button 
            onClick={() => handleConsent(true)} 
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? "Saving..." : "Yes, share it anonymously"}
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => handleConsent(false)} 
            disabled={isLoading}
            className="w-full"
          >
            No thanks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
