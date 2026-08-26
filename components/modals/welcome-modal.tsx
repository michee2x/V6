"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, X, ArrowRight } from "lucide-react";
import { setWelcomeModalSeen } from "@/app/actions/user";
import { useRouter } from "next/navigation";

const FREE_CREDITS = 30;

export function WelcomeModal() {
  const [open, setOpen] = React.useState(false);
  const [credits, setCredits] = React.useState(FREE_CREDITS);
  const router = useRouter();

  React.useEffect(() => {
    // Check if user has seen the modal yet via an API call or user state.
    // For this example, we assume there's an endpoint that tells us if it's a new sign-up
    // Or we simply show it if a URL param `?welcome=true` is present, or check local storage as fallback.
    const checkWelcomeStatus = async () => {
      try {
        const res = await fetch("/api/user/welcome-status");
        if (res.ok) {
          const status = await res.json();
          if (status.showWelcome) {
            setCredits(status.credits || FREE_CREDITS);
            setOpen(true);
          }
        }
      } catch (e) {
        // Fallback or ignore
      }
    };
    checkWelcomeStatus();
  }, []);

  const handleClose = async () => {
    setOpen(false);
    await setWelcomeModalSeen();
    router.refresh(); // Refresh to update navbar credits
  };

  const handleUpgrade = async () => {
    setOpen(false);
    await setWelcomeModalSeen();
    router.push("/#pricing");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="welcome-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="welcome-modal"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-sm">
              {/* Card */}
              <div className="relative rounded-2xl border border-border bg-background shadow-xl overflow-hidden">
                {/* Close */}
                <button
                  onClick={handleClose}
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
                      Welcome to Recrea8!
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      As a thank you for joining, we've added <span className="font-semibold text-foreground">{credits} free credits</span> to your account. Start creating right away — no card needed.
                    </p>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col gap-3 w-full mt-2">
                    <button
                      onClick={handleClose}
                      className="flex items-center justify-center w-full px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-sm font-semibold text-primary-foreground shadow-sm transition-all"
                    >
                      Start Creating
                    </button>
                    <button
                      onClick={handleUpgrade}
                      className="flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-sm font-medium text-foreground transition-all"
                    >
                      View Plans
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  
                  <p className="text-[11px] text-muted-foreground/80 mt-[-4px]">
                    Free credits expire after 24 hours.
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
