'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/button';

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

  useEffect(() => {
    if (paddleInitialized && autoOpen && window.Paddle) {
      window.Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: { email },
        customData: { user_id: userId },
      });
      // Clean up URL so it doesn't pop open again if they refresh
      window.history.replaceState({}, '', '/pricing');
    }
  }, [paddleInitialized, autoOpen, priceId, userId, email]);

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
                  window.location.href = "/subscribed";
                }
              }
            });
            setPaddleInitialized(true);
          }
        }}
      />
      <Button
        className={className}
        disabled={!paddleInitialized}
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
        Upgrade to {planName}
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
