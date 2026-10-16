"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { MobileBottomNav } from "@/components/shared/MobileBottomNav";
import { CreatePlanForm } from "@/components/home/CreatePlanForm";
import { HowItWorks } from "@/components/home/HowItWorks";
import { CommunityShowcase } from "@/components/home/CommunityShowcase";
import { FeedbackSheet } from "@/components/shared/FeedbackSheet";
import { Sparkles, MapPin, Compass, ShieldCheck } from "lucide-react";

export default function Home() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const currentUser = useQuery(api.users.getCurrentUser);

  const credits = currentUser
    ? { credits: currentUser.credits, freeCredits: currentUser.freeCredits }
    : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header onOpenFeedback={() => setFeedbackOpen(true)} credits={credits} />

      <main className="flex-1 pb-16 md:pb-0">
        {/* Editorial Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
          {/* Subtle warm ambient glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-terracotta-500/10 via-sand-200/20 to-transparent dark:from-terracotta-900/20 dark:via-sand-950/20 blur-3xl -z-10 pointer-events-none" />

          <div className="container max-w-5xl px-4 sm:px-8">
            <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sand-100 dark:bg-sand-900/50 text-sand-800 dark:text-sand-300 border border-sand-300/40 dark:border-sand-700/40 text-xs font-semibold mb-6 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-terracotta-500" />
                <span>Next-Generation Editorial Travel Planning</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-foreground leading-[1.15]">
                Journeys Penned by Intelligence,{" "}
                <span className="italic font-normal bg-gradient-to-r from-terracotta-600 to-amber-600 bg-clip-text text-transparent">
                  Crafted for the Connoisseur
                </span>
              </h1>

              <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Enter your dream destination and dates. Watch as our AI generates an
                editorial guide, interactive Google Map, day-by-day morning-to-night pacing,
                authentic cuisine recommendations, and expense tracking.
              </p>

                {/* Trust badging */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground/80 font-medium">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-terracotta-500" />
                    Unlimited AI Trips
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Compass className="h-4 w-4 text-terracotta-500" />
                    Live Section Streaming
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-terracotta-500" />
                    Google Maps & Weather
                  </span>
                </div>
              </div>

              {/* Embedded Interactive Trip Planner Form */}
              <div className="max-w-3xl mx-auto">
                <CreatePlanForm />
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <HowItWorks />

          {/* Community Public Plans Showcase */}
          <CommunityShowcase />
        </main>

      <Footer />
      <MobileBottomNav />

      {/* Global Feedback Slide-Out Sheet */}
      <FeedbackSheet isOpen={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
}
