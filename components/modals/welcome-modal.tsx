"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Gift, Sparkles, Zap, ArrowRight, X } from "lucide-react";
import { getWelcomeModalStatus, markWelcomeModalSeen } from "@/app/actions/user";

const FREE_CREDITS = 30;

export function WelcomeModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [credits, setCredits] = React.useState(FREE_CREDITS);
  const [isClosing, setIsClosing] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    getWelcomeModalStatus().then((status) => {
      if (!mounted) return;
      if (status?.shouldShow) {
        setCredits(status.credits);
        // Small delay for a polished feel after page load
        setTimeout(() => setIsOpen(true), 800);
      }
    });
    return () => { mounted = false; };
  }, []);

  const handleClose = async () => {
    setIsClosing(true);
    await markWelcomeModalSeen();
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200);
  };

  const handleUpgrade = async () => {
    await markWelcomeModalSeen();
    setIsOpen(false);
    router.push("/pricing");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="relative w-full max-w-md pointer-events-auto">
              {/* Glow effect behind card */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-amber-500/20 blur-xl" />

              {/* Card */}
              <div className="relative rounded-2xl border border-white/10 bg-[hsl(var(--background))] overflow-hidden shadow-2xl">
                {/* Gradient header strip */}
                <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400" />

                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="px-8 pb-8 pt-6 flex flex-col items-center text-center gap-6">
                  {/* Icon cluster */}
                  <div className="relative flex items-center justify-center w-24 h-24">
                    {/* Outer ring pulse */}
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20"
                      animate={{ scale: [1, 1.12, 1] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    {/* Inner circle */}
                    <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/30">
                      <Gift className="w-8 h-8 text-white" strokeWidth={1.5} />
                    </div>
                    {/* Floating sparkles */}
                    <motion.div
                      className="absolute -top-1 -right-1"
                      animate={{ y: [-2, 2, -2], rotate: [0, 15, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Sparkles className="w-5 h-5 text-amber-400" />
                    </motion.div>
                    <motion.div
                      className="absolute -bottom-1 -left-1"
                      animate={{ y: [2, -2, 2], rotate: [0, -10, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                    >
                      <Zap className="w-4 h-4 text-fuchsia-400" />
                    </motion.div>
                  </div>

                  {/* Text */}
                  <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                      Welcome to Recrea8! 🎉
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      As a thank you for joining, we've dropped{" "}
                      <span className="font-semibold text-foreground">
                        {credits} free credits
                      </span>{" "}
                      into your account. Start creating content right away — no card needed.
                    </p>
                  </div>

                  {/* Credits pill */}
                  <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
                    <Zap className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-semibold text-violet-300">
                      {credits} credits added to your account
                    </span>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full pt-1">
                    <button
                      onClick={handleClose}
                      className="flex-1 px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                    >
                      Start Creating
                    </button>
                    <button
                      onClick={handleUpgrade}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Upgrade Plan
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[11px] text-muted-foreground/60">
                    Free credits expire after 24 hours · No credit card required
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
