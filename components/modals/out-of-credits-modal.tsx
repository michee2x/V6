"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Zap, X, Sparkles, ArrowRight } from "lucide-react";

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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="ooc-modal"
            initial={{ opacity: 0, scale: 0.88, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="relative w-full max-w-sm pointer-events-auto">
              {/* Glow */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-amber-500/25 via-orange-500/15 to-rose-500/20 blur-xl" />

              {/* Card */}
              <div className="relative rounded-2xl border border-white/10 bg-[hsl(var(--background))] overflow-hidden shadow-2xl">
                {/* Gradient top strip */}
                <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />

                {/* Close */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="px-7 pb-7 pt-6 flex flex-col items-center text-center gap-5">
                  {/* Icon */}
                  <div className="relative flex items-center justify-center w-20 h-20">
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20"
                      animate={{ scale: [1, 1.14, 1] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-400/30">
                      <Zap className="w-7 h-7 text-white" strokeWidth={2} />
                    </div>
                    <motion.div
                      className="absolute -top-1 -right-1"
                      animate={{ y: [-2, 2, -2], rotate: [0, 12, 0] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </motion.div>
                  </div>

                  {/* Text */}
                  <div className="flex flex-col gap-2">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                      Out of credits
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      You've used all your credits for this period. Upgrade to a paid plan to keep creating — or wait for your next reset.
                    </p>
                  </div>

                  {/* Credit costs hint */}
                  <div className="w-full rounded-xl border border-border bg-muted/30 p-3 text-left flex flex-col gap-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Credit costs</p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>📄 Document</span><span className="font-medium text-foreground">5 credits</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>🖼️ Image</span><span className="font-medium text-foreground">40 credits</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>🎬 Video</span><span className="font-medium text-foreground">150 credits</span>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="flex flex-col gap-2.5 w-full">
                    <Link
                      href="/pricing"
                      onClick={onClose}
                      className="flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]"
                      id="out-of-credits-upgrade-btn"
                    >
                      <Sparkles className="w-4 h-4" />
                      Upgrade Plan
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={onClose}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
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
