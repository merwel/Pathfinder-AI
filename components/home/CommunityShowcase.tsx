"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns";
import { MapPin, Calendar, Users, ArrowUpRight, Compass } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function CommunityShowcase() {
  const publishedPlans = useQuery(api.communityPlans.latestPublished, { limit: 8 });

  // Hide the section completely if loading or if there are no published plans yet
  if (!publishedPlans || publishedPlans.length === 0) {
    return null;
  }

  return (
    <section className="py-20">
      <div className="container max-w-6xl px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-terracotta-600 dark:text-terracotta-400 font-sans">
              Published Journeys
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
              Curated by the Community
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Real itineraries crafted and shared by fellow travelers around the globe.
            </p>
          </div>
          <Link
            href="/community-plans"
            className="text-xs font-semibold uppercase tracking-wider text-terracotta-600 hover:text-terracotta-700 dark:text-terracotta-400 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>View All Public Trips</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {publishedPlans.map((plan: any) => {
            const dateRangeStr =
              plan.fromDate && plan.toDate
                ? `${format(new Date(plan.fromDate), "MMM d")} - ${format(
                    new Date(plan.toDate),
                    "MMM d, yyyy"
                  )}`
                : "Flexible Dates";

            return (
              <Link
                key={plan._id}
                href={`/plans/${plan._id}/community-plan`}
                className="group relative rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Photo Thumbnail */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand-200 dark:bg-card">
                  {plan.imageUrl ? (
                    <img
                      src={plan.imageUrl}
                      alt={plan.nameoftheplace}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-tr from-sand-300 to-terracotta-200 dark:from-sand-900/60 dark:to-terracotta-900/40 text-terracotta-700 dark:text-terracotta-300">
                      <Compass className="h-10 w-10 opacity-70" />
                    </div>
                  )}
                  {plan.companion && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="backdrop-blur-md bg-background/80 text-[11px] font-medium shadow-sm capitalize">
                        {plan.companion}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-foreground group-hover:text-terracotta-600 dark:group-hover:text-terracotta-400 transition-colors line-clamp-1">
                      {plan.nameoftheplace}
                    </h3>
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {plan.abouttheplace || "A bespoke travel itinerary featuring curated cultural places and cuisine."}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium truncate">
                      <Calendar className="h-3 w-3 text-terracotta-500" />
                      {dateRangeStr}
                    </span>
                    <span className="font-serif italic text-muted-foreground/80 shrink-0">
                      by {plan.ownerName || "Voyager"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
