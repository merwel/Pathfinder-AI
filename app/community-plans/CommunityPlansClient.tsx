"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Globe,
  Calendar,
  Users,
  Compass,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TopUtilityBar } from "@/components/shared/TopUtilityBar";

const COMPANIONS = [
  { id: "all", label: "All Journeys" },
  { id: "solo", label: "Solo" },
  { id: "couple", label: "Couples" },
  { id: "family", label: "Family" },
  { id: "friends", label: "Friends" },
];

export function CommunityPlansClient() {
  const [selectedCompanion, setSelectedCompanion] = useState("all");

  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.communityPlans.getPaginatedPublished,
    { companion: selectedCompanion },
    { initialNumItems: 8 }
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top Utility Bar with Return to Home & Dashboard */}
      <TopUtilityBar />

      {/* Editorial Hero Header */}
      <section className="relative overflow-hidden border-b border-border/70 bg-gradient-to-b from-warmSand-100/50 via-background to-background dark:from-warmSand-950/20 py-16 sm:py-20">
        <div className="container max-w-6xl px-4 sm:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <Globe className="h-3.5 w-3.5" />
            <span>Community Showcase</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
            Travel Stories & Curated Guides
          </h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
            Discover itineraries handcrafted by travelers and enriched with AI insight.
            Explore authentic recommendations from destinations around the globe.
          </p>

          {/* Companion Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-6">
            {COMPANIONS.map((c) => {
              const isActive = selectedCompanion === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCompanion(c.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-border/70 bg-card text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Grid of Published Trips */}
      <div className="container max-w-6xl px-4 sm:px-8 pt-12 space-y-12">
        {isLoading && results.length === 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-3xl border border-border/60 bg-card p-4 space-y-4 shadow-sm"
              >
                <Skeleton className="h-48 w-full rounded-2xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/80 p-12 text-center space-y-4 bg-card/40">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-foreground">
              No Trips Published Yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Be the first to share an itinerary with the community! Create a travel plan
              and toggle public publishing in your trip settings.
            </p>
            <Button asChild className="rounded-full">
              <Link href="/">Create a Travel Plan</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((plan: any) => {
              const formattedDates =
                plan.fromDate && plan.toDate
                  ? `${format(new Date(plan.fromDate), "d MMM")} – ${format(
                      new Date(plan.toDate),
                      "d MMM yyyy"
                    )}`
                  : null;

              return (
                <Link
                  key={plan._id}
                  href={`/plans/${plan._id}/community-plan`}
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-xl"
                >
                  {/* Card Cover */}
                  <div className="relative h-52 w-full overflow-hidden bg-muted">
                    {plan.imageUrl ? (
                      <img
                        src={plan.imageUrl}
                        alt={plan.nameoftheplace}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-tr from-warmSand-700 via-terracotta-700 to-terracotta-900 flex items-center justify-center">
                        <span className="font-serif text-2xl font-bold text-white/50 tracking-wider">
                          {plan.nameoftheplace}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />

                    {plan.companion && (
                      <span className="absolute top-3 left-3 rounded-full bg-background/80 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-foreground shadow-sm capitalize">
                        {plan.companion}
                      </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                    <div className="space-y-2">
                      {formattedDates && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          <span>{formattedDates}</span>
                        </div>
                      )}

                      <h3 className="font-serif text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {plan.nameoftheplace}
                      </h3>

                      <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                        {plan.abouttheplace || "Curated multi-day itinerary with daily recommendations and activities."}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-border/40">
                      {/* Activity Tags */}
                      {plan.activityPreferences && plan.activityPreferences.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {plan.activityPreferences.slice(0, 3).map((tag: string) => (
                            <span
                              key={tag}
                              className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs font-semibold text-primary pt-1">
                        <span>Read Itinerary</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Load More Pagination */}
        {status === "CanLoadMore" && (
          <div className="flex justify-center pt-6">
            <Button
              variant="outline"
              size="lg"
              onClick={() => loadMore(8)}
              disabled={isLoading}
              className="rounded-full px-8 shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading Guides...
                </>
              ) : (
                "Load More Guides"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
