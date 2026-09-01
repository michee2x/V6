"use client";

import * as React from "react";
import { WhitelabelModal } from "@/components/features/contact/whitelabel-modal";
import { Button } from "@/components/ui/button";

interface WhitelabelCardProps {
  user?: { name: string; email: string } | null;
}

export function WhitelabelCard({ user }: WhitelabelCardProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div className="rounded-2xl border border-border shadow-sm overflow-hidden bg-card transition-all duration-300 hover:-translate-y-1">
        <div className="p-6 sm:p-8 flex flex-col gap-4">
          <div>
            <h4 className="text-h3 font-bold text-foreground">Whitelabel</h4>
            <p className="text-body text-muted-foreground mt-2">
              Want to use our engine under your own brand? We offer custom whitelabel solutions for businesses and agencies.
            </p>
          </div>
          
          <Button 
            onClick={() => setOpen(true)}
            className="w-full font-semibold"
          >
            Request Whitelabel
          </Button>
        </div>
      </div>

      {/* Modal */}
      <WhitelabelModal open={open} onOpenChange={setOpen} user={user} />
    </>
  );
}
