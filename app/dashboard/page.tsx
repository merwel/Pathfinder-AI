"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { MobileBottomNav } from "@/components/shared/MobileBottomNav";
import { NewPlanModal } from "@/components/dashboard/NewPlanModal";
import { FeedbackSheet } from "@/components/shared/FeedbackSheet";
import { format } from "date-fns";
import {
  PlusCircle,
  Sparkles,
  Calendar,
  Compass,
  Users,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Plane,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [newPlanOpen, setNewPlanOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const currentUser = useQuery(api.users.getCurrentUser);
  const syncUser = useMutation(api.users.syncCurrentUser);
  const userPlans = useQuery(api.plan.getUserPlans);

  // Sync user record on dashboard load
  useEffect(() => {
    syncUser().catch(() => {});
  }, [syncUser]);

  const totalCredits = (currentUser?.freeCredits ?? 0) + (currentUser?.credits ?? 0);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header
        onOpenFeedback={() => setFeedbackOpen(true)}
        credits={currentUser ? { credits: currentUser.credits, freeCredits: currentUser.freeCredits } : undefined}
      />

      <main className="flex-1 container max-w-6xl px-4 py-8 sm:px-8 sm:py-12 pb-24 md:pb-12">
        {/* Top Header & Overview */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-border/60">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-terracotta-600 dark:text-terracotta-400 font-sans">
              Your Expedition Portfolio
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-1">
              Curated Journeys
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your personal itineraries, collaborate with friends, and review trip expenses.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Unlimited Trips pill */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-sand-100 dark:bg-card border border-sand-300/50 dark:border-border text-xs">
              <Sparkles className="h-4 w-4 text-terracotta-500 shrink-0" />
              <span className="font-semibold text-foreground">Unlimited AI Trips</span>
            </div>

            <Button
              onClick={() => setNewPlanOpen(true)}
              variant="terracotta"
              className="rounded-xl gap-2 text-sm font-medium shadow-md"
            >
              <PlusCircle className="h-4 w-4" />
              <span>New Journey</span>
            </Button>
          </div>
        </div>

        {/* Plans Grid */}
        {userPlans === undefined ? (
          // Loading Skeletons
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-3xl border border-border/80 bg-card p-4 space-y-4">
                <Skeleton className="h-44 w-full rounded-2xl" />
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-lg" />
              </div>
            ))}
          </div>
        ) : userPlans.length === 0 ? (
          // Empty State
          <div className="rounded-3xl border-2 border-dashed border-border/80 bg-sand-50/30 dark:bg-card/20 p-12 text-center max-w-xl mx-auto my-8">
            <div className="h-16 w-16 rounded-3xl bg-sand-100 dark:bg-sand-900/40 text-terracotta-600 dark:text-terracotta-400 flex items-center justify-center mx-auto mb-4 border border-sand-300 dark:border-sand-800">
              <Plane className="h-8 w-8" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
              No Journeys Planned Yet
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto mb-6">
              You haven&apos;t created any trip plans yet. Enter a destination and dates to let our AI craft your first bespoke adventure.
            </p>
            <Button
              onClick={() => setNewPlanOpen(true)}
              variant="terracotta"
              size="lg"
              className="rounded-2xl gap-2 shadow-md text-sm font-medium"
            >
              <Sparkles className="h-4 w-4" />
              <span>Plan Your First Trip</span>
            </Button>
          </div>
        ) : (
          // Trip Cards Grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {userPlans.map((item: any) => {
              const settings = item.settings;
              const dateRangeStr =
                settings?.fromDate && settings?.toDate
                  ? `${format(new Date(settings.fromDate), "MMM d")} - ${format(
                      new Date(settings.toDate),
                      "MMM d, yyyy"
                    )}`
                  : "Dates unassigned";

              const flags = item.contentGenerationState || {};
              const readyCount = Object.values(flags).filter(Boolean).length;
              const isStillStreaming = item.isGeneratedUsingAI && readyCount < 8;

              return (
                <div
                  key={item._id}
                  className="group rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Cover Thumbnail */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-sand-200 dark:bg-sand-900/40">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.nameoftheplace}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-tr from-sand-300 to-terracotta-200 dark:from-sand-900/60 dark:to-terracotta-900/40 text-terracotta-700 dark:text-terracotta-300">
                          <Compass className="h-10 w-10 opacity-70" />
                        </div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                        {item.isShared ? (
                          <Badge variant="secondary" className="backdrop-blur-md bg-blue-500/80 text-white font-medium text-[10px]">
                            Shared with you
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="backdrop-blur-md bg-background/80 font-medium text-[10px]">
                            Owner
                          </Badge>
                        )}
                        {settings?.isPublished && (
                          <Badge variant="terracotta" className="text-[10px] font-medium">
                            Published
                          </Badge>
                        )}
                      </div>

                      {isStillStreaming && (
                        <div className="absolute bottom-3 left-3">
                          <Badge variant="secondary" className="backdrop-blur-md bg-amber-500/90 text-white text-[10px] animate-pulse">
                            Generating ({readyCount}/8 sections)
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="p-5">
                      <h3 className="font-serif text-xl font-semibold text-foreground group-hover:text-terracotta-600 dark:group-hover:text-terracotta-400 transition-colors line-clamp-1">
                        {item.nameoftheplace}
                      </h3>

                      <div className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 text-terracotta-500 shrink-0" />
                        <span>{dateRangeStr}</span>
                      </div>

                      {settings?.companion && (
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground capitalize">
                          <Users className="h-3.5 w-3.5 text-terracotta-500 shrink-0" />
                          <span>{settings.companion} traveler</span>
                        </div>
                      )}

                      <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.abouttheplace || "Your custom itinerary and recommendations are ready to explore."}
                      </p>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-5 pt-0 border-t border-border/40 mt-2">
                    <Link href={`/plans/${item._id}/plan`} className="w-full">
                      <Button
                        variant="outline"
                        className="w-full rounded-xl justify-between group-hover:border-primary group-hover:text-primary transition-colors text-xs font-medium"
                      >
                        <span>View Itinerary</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
      <MobileBottomNav />

      {/* New Trip Dialog */}
      <NewPlanModal isOpen={newPlanOpen} onOpenChange={setNewPlanOpen} />

      {/* Feedback Sheet */}
      <FeedbackSheet isOpen={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
}
