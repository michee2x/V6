"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Zap, X, ArrowRight } from "lucide-react";

interface OutOfCreditsModalProps {
  open: boolean;
  onClose: () => void;
}

export function OutOfCreditsModal({ open, onClose }: OutOfCreditsModalProps) {
  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="ooc-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="ooc-modal"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="relative w-full max-w-sm pointer-events-auto">
              {/* Card */}
              <div className="relative rounded-2xl border border-border bg-background overflow-hidden shadow-xl">
                {/* Close */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="px-6 pb-6 pt-8 flex flex-col items-center text-center gap-6">
                  {/* Simple Icon */}
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary">
                    <Zap className="w-6 h-6" strokeWidth={2.5} />
                  </div>

                  {/* Text */}
                  <div className="flex flex-col gap-2">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                      Out of credits
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      You've used all your credits. Upgrade to a paid plan to keep creating, or wait for your next billing cycle.
                    </p>
                  </div>

                  {/* Credit costs hint */}
                  <div className="w-full rounded-xl border border-border bg-muted/50 p-3 text-left flex flex-col gap-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Cost Guide</p>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Document Analysis</span><span className="font-medium text-foreground">5 cr</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Standard Image</span><span className="font-medium text-foreground">40 cr</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Video Generation</span><span className="font-medium text-foreground">150 cr</span>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="flex flex-col gap-3 w-full mt-2">
                    <Link
                      href={`/#pricing?returnUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "")}`}
                      onClick={onClose}
                      className="flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-sm font-semibold text-primary-foreground shadow-sm transition-all"
                      id="out-of-credits-upgrade-btn"
                    >
                      View Plans
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={onClose}
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Maybe later
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
