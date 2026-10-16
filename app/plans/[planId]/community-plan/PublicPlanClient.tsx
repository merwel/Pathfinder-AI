"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Calendar,
  Users,
  CreditCard,
  Sun,
  Sunset,
  Moon,
  MapPin,
  UtensilsCrossed,
  Luggage,
  Compass,
  ArrowRight,
  Globe,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WeatherWidget } from "@/components/plan/WeatherWidget";
import { PlanMap } from "@/components/plan/PlanMap";
import { TopUtilityBar } from "@/components/shared/TopUtilityBar";

interface PublicPlanClientProps {
  planId: string;
}

export function PublicPlanClient({ planId }: PublicPlanClientProps) {
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({
    0: true,
  });

  const data = useQuery(api.plan.getPublicPlan, {
    planId: planId as Id<"plan">,
  });

  const toggleDay = (index: number) => {
    setExpandedDays((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  if (data === undefined) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <TopUtilityBar />
        <div className="container max-w-5xl px-4 py-12 space-y-8 sm:px-8">
          <Skeleton className="h-72 w-full rounded-3xl" />
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <TopUtilityBar />
        <div className="container max-w-md px-4 py-24 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="font-serif text-2xl font-bold">Trip Not Available</h2>
          <p className="text-sm text-muted-foreground">
            This itinerary is either private, unpublished, or has been removed.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Button asChild className="rounded-full">
              <Link href="/community-plans">Explore Community Guides</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { plan, settings } = data;

  const formattedDates =
    settings?.fromDate && settings?.toDate
      ? `${format(new Date(settings.fromDate), "d MMM yyyy")} – ${format(
          new Date(settings.toDate),
          "d MMM yyyy"
        )}`
      : null;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Top Utility Bar with Return to Home & Dashboard */}
      <TopUtilityBar />

      {/* Editorial Header Cover */}
      <div className="relative overflow-hidden border-b border-border/70 bg-card">
        <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-muted">
          {plan.imageUrl ? (
            <img
              src={plan.imageUrl}
              alt={plan.nameoftheplace}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-tr from-warmSand-800 via-terracotta-700 to-terracotta-900 flex items-center justify-center">
              <span className="font-serif text-3xl font-bold text-white/50 tracking-wider">
                {plan.nameoftheplace}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

          {/* Top Floating Badges */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <WeatherWidget placeName={plan.nameoftheplace} />
            <span className="rounded-full bg-primary/90 backdrop-blur-md px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm flex items-center gap-1">
              <Globe className="h-3 w-3" /> Community Guide
            </span>
          </div>
        </div>

        {/* Title Content */}
        <div className="container max-w-5xl px-4 sm:px-8 pb-8 -mt-12 relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
            {formattedDates && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-card/90 backdrop-blur-md border border-border/60 px-3 py-1 shadow-sm">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                {formattedDates}
              </span>
            )}
            {settings?.companion && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-card/90 backdrop-blur-md border border-border/60 px-3 py-1 shadow-sm capitalize">
                <Users className="h-3.5 w-3.5 text-primary" />
                {settings.companion}
              </span>
            )}
            {settings?.currencyCode && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-card/90 backdrop-blur-md border border-border/60 px-3 py-1 shadow-sm">
                <CreditCard className="h-3.5 w-3.5 text-primary" />
                {settings.currencyCode}
              </span>
            )}
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
            {plan.nameoftheplace}
          </h1>

          {settings?.activityPreferences && settings.activityPreferences.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {settings.activityPreferences.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-full border border-border/60 bg-muted/40 px-3 py-0.5 text-xs text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container max-w-5xl px-4 sm:px-8 pt-10 space-y-16">
        {/* 1. About the Place & Best Time */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 rounded-3xl border border-border/70 bg-card p-6 shadow-sm space-y-3">
            <h2 className="font-serif text-xl font-bold text-foreground">
              About {plan.nameoftheplace}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {plan.abouttheplace}
            </p>
          </div>

          <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Sun className="h-4 w-4" /> Best Time to Visit
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {plan.besttimetovisit || "Ideal for travel throughout the standard seasonal calendar."}
            </p>
          </div>
        </div>

        {/* 2. Top Places with Map */}
        {plan.topplacestovisit && plan.topplacestovisit.length > 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground">
                Top Places to Visit
              </h2>
              <p className="text-xs text-muted-foreground">
                Key locations, landmarks, and coordinates
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-border/70 shadow-sm">
              <PlanMap
                places={plan.topplacestovisit}
                destinationName={plan.nameoftheplace}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {plan.topplacestovisit.map((p: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                    {i + 1}
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {p.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Daily Itinerary */}
        {plan.itinerary && plan.itinerary.length > 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground">
                Daily Itinerary
              </h2>
              <p className="text-xs text-muted-foreground">
                Day-by-day morning, afternoon, and evening recommendations
              </p>
            </div>

            <div className="space-y-4">
              {plan.itinerary.map((day: any, dayIdx: number) => {
                const isExpanded = !!expandedDays[dayIdx];

                return (
                  <div
                    key={dayIdx}
                    className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm"
                  >
                    <div
                      onClick={() => toggleDay(dayIdx)}
                      className="flex cursor-pointer items-center justify-between bg-muted/30 px-6 py-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-mono text-xs font-bold">
                          {dayIdx + 1}
                        </span>
                        <h3 className="font-serif text-lg font-bold text-foreground">
                          {day.title}
                        </h3>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="divide-y divide-border/40 p-6 space-y-4">
                        {/* Morning */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 pt-2">
                          <div className="flex items-center gap-2 sm:w-28 shrink-0 text-amber-500 text-xs font-bold uppercase tracking-wider">
                            <Sun className="h-4 w-4" /> Morning
                          </div>
                          <div className="flex-1 space-y-2">
                            {day.activities.morning.map((act: any, idx: number) => (
                              <div key={idx} className="rounded-xl bg-muted/20 p-3 border border-border/40">
                                <h4 className="text-sm font-semibold text-foreground">{act.itineraryItem}</h4>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{act.briefDescription}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Afternoon */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 pt-4">
                          <div className="flex items-center gap-2 sm:w-28 shrink-0 text-orange-500 text-xs font-bold uppercase tracking-wider">
                            <Sunset className="h-4 w-4" /> Afternoon
                          </div>
                          <div className="flex-1 space-y-2">
                            {day.activities.afternoon.map((act: any, idx: number) => (
                              <div key={idx} className="rounded-xl bg-muted/20 p-3 border border-border/40">
                                <h4 className="text-sm font-semibold text-foreground">{act.itineraryItem}</h4>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{act.briefDescription}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Evening */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 pt-4">
                          <div className="flex items-center gap-2 sm:w-28 shrink-0 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                            <Moon className="h-4 w-4" /> Evening
                          </div>
                          <div className="flex-1 space-y-2">
                            {day.activities.evening.map((act: any, idx: number) => (
                              <div key={idx} className="rounded-xl bg-muted/20 p-3 border border-border/40">
                                <h4 className="text-sm font-semibold text-foreground">{act.itineraryItem}</h4>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{act.briefDescription}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Activities & Local Delicacies */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Activities */}
          {plan.adventuresactivitiestodo && plan.adventuresactivitiestodo.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
                <Compass className="h-5 w-5 text-primary" /> Top Activities
              </h2>
              <div className="space-y-2.5">
                {plan.adventuresactivitiestodo.map((act: string, i: number) => (
                  <div key={i} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm text-sm">
                    {act}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cuisines */}
          {plan.localcuisinerecommendations && plan.localcuisinerecommendations.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-primary" /> Must-Try Cuisines
              </h2>
              <div className="space-y-2.5">
                {plan.localcuisinerecommendations.map((food: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm text-sm">
                    <span>🍲</span>
                    <span>{food}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. Packing Checklist (Read-only) */}
        {plan.packingchecklist && plan.packingchecklist.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
              <Luggage className="h-5 w-5 text-primary" /> Recommended Packing List
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {plan.packingchecklist.map((item: string, i: number) => (
                <div key={i} className="rounded-xl border border-border/50 bg-card p-3 text-xs font-medium text-foreground shadow-sm flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA Card */}
        <div className="rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-card p-8 sm:p-10 shadow-lg text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold shadow-md">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
            Inspired by {plan.nameoftheplace}?
          </h2>
          <p className="mx-auto max-w-lg text-sm text-muted-foreground">
            Create your own customized travel itinerary powered by artificial intelligence.
            Get weather insights, custom day-by-day itineraries, and budget tracking.
          </p>
          <div className="pt-2">
            <Button asChild size="lg" className="rounded-full px-8 shadow-md">
              <Link href="/">
                Generate Your Own Trip <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
