'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';

interface CheckoutButtonProps {
  priceId: string;
  userId: string;
  email: string;
  planName: string;
  className?: string;
  autoOpen?: boolean;
}

export function CheckoutButton({ priceId, userId, email, planName, className, autoOpen }: CheckoutButtonProps) {
  const [paddleInitialized, setPaddleInitialized] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (paddleInitialized && autoOpen && window.Paddle) {
      window.Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: { email },
        customData: { user_id: userId },
      });
      // Clean up URL so it doesn't pop open again if they refresh
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('checkout');
      window.history.replaceState({}, '', currentUrl.toString());
    }
  }, [paddleInitialized, autoOpen, priceId, userId, email]);

  useEffect(() => {
    const handleCheckoutCompleted = async () => {
      setIsUpgrading(true);
      
      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get("returnUrl") || "/history";
      const separator = returnUrl.includes("?") ? "&" : "?";
      const finalUrl = `${returnUrl}${separator}upgrade_success=1`;

      // Poll Supabase until the plan changes from 'free' (max 10 seconds)
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        const { data } = await supabase
          .from('users')
          .select('plan')
          .eq('id', userId)
          .single();
          
        if ((data && data.plan !== 'free') || attempts >= 10) {
          clearInterval(pollInterval);
          window.location.href = finalUrl;
        }
      }, 1000);
    };

    window.addEventListener("paddle-checkout-completed", handleCheckoutCompleted);
    return () => window.removeEventListener("paddle-checkout-completed", handleCheckoutCompleted);
  }, [userId, supabase]);

  return (
    <>
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        onLoad={() => {
          // Initialize Paddle
          if (typeof window !== 'undefined' && window.Paddle) {
            window.Paddle.Environment.set(
              process.env.NEXT_PUBLIC_PADDLE_ENV === 'sandbox' ? 'sandbox' : 'production'
            );
            window.Paddle.Initialize({ 
              token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
              eventCallback: function(data: any) {
                if (data.name === "checkout.completed") {
                  window.dispatchEvent(new CustomEvent("paddle-checkout-completed"));
                }
              }
            });
            setPaddleInitialized(true);
          }
        }}
      />
      <Button
        className={className}
        disabled={!paddleInitialized || isUpgrading}
        onClick={() => {
          if (window.Paddle) {
            window.Paddle.Checkout.open({
              items: [{ priceId, quantity: 1 }],
              customer: {
                email: email,
              },
              customData: {
                user_id: userId,
              },
            });
          }
        }}
      >
        {isUpgrading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Finalizing upgrade...
          </>
        ) : (
          `Upgrade to ${planName}`
        )}
      </Button>
    </>
  );
}

// Add global type for Paddle
declare global {
  interface Window {
    Paddle: any;
  }
}
