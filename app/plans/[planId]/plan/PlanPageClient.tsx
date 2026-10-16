"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanHeader } from "@/components/plan/PlanHeader";
import { SectionNavPills } from "@/components/plan/SectionNavPills";
import { PlanSwitcher } from "@/components/plan/PlanSwitcher";
import { AboutSection } from "@/components/plan/AboutSection";
import { PlacesSection } from "@/components/plan/PlacesSection";
import { ItinerarySection } from "@/components/plan/ItinerarySection";
import { ActivitiesSection } from "@/components/plan/ActivitiesSection";
import { CuisinesSection } from "@/components/plan/CuisinesSection";
import { PackingSection } from "@/components/plan/PackingSection";
import { AlertTriangle, Compass, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopUtilityBar } from "@/components/shared/TopUtilityBar";
import Link from "next/link";

interface PlanPageClientProps {
  planId: string;
}

export function PlanPageClient({ planId }: PlanPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewPlan = searchParams.get("isNewPlan") === "true";

  const data = useQuery(api.plan.getPlan, {
    planId: planId as Id<"plan">,
  });

  const [activeSection, setActiveSection] = useState("about");

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // Scroll spy to update active section
  useEffect(() => {
    const handleScroll = () => {
      const sectionIds = ["about", "places", "itinerary", "activities", "cuisines", "packing"];
      const scrollPosition = window.scrollY + 120;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(sectionIds[i]);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Loading state
  if (data === undefined) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopUtilityBar />
        <div className="container max-w-6xl px-4 py-8 space-y-8 sm:px-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-48 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
          <Skeleton className="h-72 w-full rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // Not found or no access
  if (data === null) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopUtilityBar />
        <div className="container max-w-md px-4 py-24 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="font-serif text-2xl font-bold">Trip Not Found</h2>
          <p className="text-sm text-muted-foreground">
            You don't have permission to view this travel plan, or it has been removed.
          </p>
          <Button asChild className="rounded-full">
            <Link href="/dashboard">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const { plan, settings, isOwner } = data;
  const state = plan.contentGenerationState || {};

  // Count ready flags
  const flags = [
    state.imagination,
    state.abouttheplace,
    state.besttimetovisit,
    state.adventuresactivitiestodo,
    state.topplacestovisit,
    state.itinerary,
    state.localcuisinerecommendations,
    state.packingchecklist,
  ];
  const readyCount = flags.filter(Boolean).length;
  const totalCount = 8;

  // Section readiness
  const isAboutReady = !!state.abouttheplace && !!state.besttimetovisit;
  const isPlacesReady = !!state.topplacestovisit;
  const isItineraryReady = !!state.itinerary;
  const isActivitiesReady = !!state.adventuresactivitiestodo;
  const isCuisinesReady = !!state.localcuisinerecommendations;
  const isPackingReady = !!state.packingchecklist;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Utility Bar with Return to Home, Dashboard & Plan Switcher */}
      <TopUtilityBar
        rightContent={
          <div className="text-xs text-muted-foreground hidden sm:block mr-2">
            {isOwner ? "Owner" : "Collaborator"} Mode
          </div>
        }
      >
        <div className="h-4 w-px bg-border/70 shrink-0" />
        <PlanSwitcher currentPlanId={planId} currentPlanName={plan.nameoftheplace} />
      </TopUtilityBar>

      <div className="container max-w-6xl px-4 sm:px-8 pt-6 space-y-8">
        {/* Header with Cover, Badges, Weather, Warnings */}
        <PlanHeader
          plan={plan}
          settings={settings}
          isOwner={isOwner}
          isNewPlan={isNewPlan}
          readyCount={readyCount}
          totalCount={totalCount}
        />
      </div>

      {/* Sticky Section Navigation Pills */}
      <div className="mt-6">
        <SectionNavPills
          planId={planId}
          activeSection={activeSection}
          onSectionClick={scrollToSection}
          isOwner={isOwner}
        />
      </div>

      {/* Main Plan Content Sections */}
      <div className="container max-w-6xl px-4 sm:px-8 pt-8 space-y-16">
        {/* 1. Overview & Best Time */}
        <AboutSection
          planId={plan._id}
          abouttheplace={plan.abouttheplace}
          besttimetovisit={plan.besttimetovisit}
          isReady={isAboutReady}
          canEdit={true}
        />

        {/* 2. Top Places to Visit with Google Map */}
        <PlacesSection
          planId={plan._id}
          destinationName={plan.nameoftheplace}
          places={plan.topplacestovisit || []}
          isReady={isPlacesReady}
          canEdit={true}
        />

        {/* 3. Daily Itinerary */}
        <ItinerarySection
          planId={plan._id}
          itinerary={plan.itinerary || []}
          isReady={isItineraryReady}
          canEdit={true}
        />

        {/* 4. Activities & Adventures */}
        <ActivitiesSection
          planId={plan._id}
          activities={plan.adventuresactivitiestodo || []}
          isReady={isActivitiesReady}
          canEdit={true}
        />

        {/* 5. Local Cuisines */}
        <CuisinesSection
          planId={plan._id}
          cuisines={plan.localcuisinerecommendations || []}
          isReady={isCuisinesReady}
          canEdit={true}
        />

        {/* 6. Packing Checklist */}
        <PackingSection
          planId={plan._id}
          checklist={plan.packingchecklist || []}
          isReady={isPackingReady}
          canEdit={true}
        />
      </div>
    </div>
  );
}
