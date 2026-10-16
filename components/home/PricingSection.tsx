"use client";

import React, { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { Sparkles, Check, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CREDIT_PACK } from "@/lib/constants";

export function PricingSection() {
  const isEnabled = useQuery(api.payments.isPaymentsEnabled);
  const createCheckout = useAction(api.stripe.createCheckoutSession);
  const { isSignedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // If Stripe payments are disabled or omitted, hide the pricing section entirely
  if (!isEnabled) {
    return null;
  }

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      const res = await createCheckout();
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      console.error("Failed to start checkout:", err);
      setIsLoading(false);
    }
  };

  return (
    <section id="pricing" className="py-20 border-t border-border/60">
      <div className="container max-w-4xl px-4 sm:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-terracotta-600 dark:text-terracotta-400 font-sans">
            Simple, Transparent Value
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
            Pathfinder Credit Packages
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Every user starts with 2 complimentary trip generations. Top up whenever you&apos;re ready for your next grand adventure.
          </p>
        </div>

        <div className="max-w-md mx-auto rounded-3xl border-2 border-primary/20 bg-card p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-2xl">
            Popular Choice
          </div>

          <div className="flex items-center gap-2 text-terracotta-600 dark:text-terracotta-400 mb-2">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">{CREDIT_PACK.name}</span>
          </div>

          <div className="flex items-baseline gap-2 mb-4">
            <span className="font-serif text-4xl font-bold text-foreground">
              {CREDIT_PACK.displayPrice}
            </span>
            <span className="text-xs text-muted-foreground">one-time payment</span>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            {CREDIT_PACK.description}
          </p>

          <ul className="space-y-3 mb-8">
            {CREDIT_PACK.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-foreground/90">
                <Check className="h-4 w-4 text-terracotta-500 shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {isSignedIn ? (
            <Button
              onClick={handleCheckout}
              disabled={isLoading}
              variant="terracotta"
              className="w-full h-12 rounded-xl text-sm font-medium gap-2 shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Preparing Secure Checkout...</span>
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  <span>Purchase {CREDIT_PACK.name}</span>
                </>
              )}
            </Button>
          ) : (
            <SignInButton mode="modal">
              <Button variant="terracotta" className="w-full h-12 rounded-xl text-sm font-medium gap-2 shadow-md">
                <span>Sign In to Purchase Credits</span>
              </Button>
            </SignInButton>
          )}
        </div>
      </div>
    </section>
  );
}
