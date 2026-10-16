"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Calendar,
  Users,
  CreditCard,
  Share2,
  Settings,
  Sparkles,
  AlertTriangle,
  Info,
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WeatherWidget } from "./WeatherWidget";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

interface PlanHeaderProps {
  plan: any;
  settings: any;
  isOwner: boolean;
  isNewPlan: boolean;
  readyCount: number;
  totalCount: number;
}

export function PlanHeader({
  plan,
  settings,
  isOwner,
  isNewPlan,
  readyCount,
  totalCount,
}: PlanHeaderProps) {
  const [hideAiWarning, setHideAiWarning] = useState(false);
  const [hideCommunityTip, setHideCommunityTip] = useState(false);

  // Read dismissed tips from localStorage
  useEffect(() => {
    try {
      const tipDismissed = localStorage.getItem("dismissed_community_tip");
      if (tipDismissed === "true") {
        setHideCommunityTip(true);
      }
      const warningDismissed = localStorage.getItem(`dismissed_ai_warning_${plan._id}`);
      if (warningDismissed === "true") {
        setHideAiWarning(true);
      }
    } catch {
      // ignore
    }
  }, [plan._id]);

  const handleDismissAiWarning = () => {
    setHideAiWarning(true);
    try {
      localStorage.setItem(`dismissed_ai_warning_${plan._id}`, "true");
    } catch {
      // ignore
    }
  };

  const handleDismissCommunityTip = () => {
    setHideCommunityTip(true);
    try {
      localStorage.setItem("dismissed_community_tip", "true");
    } catch {
      // ignore
    }
  };

  const isAllReady = readyCount >= totalCount;
  const scheduleJobsMutation = useMutation(api.plan.scheduleGenerationJobs);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    try {
      setIsRetrying(true);
      await scheduleJobsMutation({ planId: plan._id });
      toast.info("Resumed travel guide generation!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to resume planning.");
    } finally {
      setTimeout(() => setIsRetrying(false), 2000);
    }
  };
  const showAiWarning =
    plan.isGeneratedUsingAI &&
    !hideAiWarning &&
    (isNewPlan || !isAllReady || true);

  // Formatted date string
  const formattedDates =
    settings?.fromDate && settings?.toDate
      ? `${format(new Date(settings.fromDate), "d MMM yyyy")} – ${format(
          new Date(settings.toDate),
          "d MMM yyyy"
        )}`
      : null;

  return (
    <div className="space-y-6">
      {/* 1. Collaborator Notice */}
      {!isOwner && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground shadow-sm">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
          <span>
            <strong>Collaborator View:</strong> You are viewing a shared trip.
            You can edit activities, recommendations, and manage expenses.
          </span>
        </div>
      )}

      {/* 2. Dismissible Community Share Tip */}
      {isOwner && !settings?.isPublished && !hideCommunityTip && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-secondary/40 bg-secondary/10 px-4 py-3 text-sm text-foreground shadow-sm">
          <div className="flex items-center gap-2.5">
            <Share2 className="h-4 w-4 text-secondary shrink-0" />
            <span>
              <strong>Share your itinerary:</strong> Love this plan? Publish it to
              the Community Showcase in Settings so fellow travelers can explore it!
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
            onClick={handleDismissCommunityTip}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* 3. AI Generation Verification Banner */}
      {showAiWarning && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <div>
              <span className="font-semibold text-amber-700 dark:text-amber-400">
                AI-Generated Itinerary:
              </span>{" "}
              <span className="text-muted-foreground">
                Recommendations, hours, and opening dates are AI-synthesized.
                Please double-check bookings and local requirements.
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
            onClick={handleDismissAiWarning}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* 4. Hero Cover & Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-lg">
        {/* Cover Image */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-muted">
          {plan.imageUrl ? (
            <img
              src={plan.imageUrl}
              alt={plan.nameoftheplace}
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-tr from-warmSand-800 via-terracotta-700 to-terracotta-900 flex items-center justify-center">
              <span className="font-serif text-3xl font-bold text-white/40 tracking-wider">
                {plan.nameoftheplace}
              </span>
            </div>
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />

          {/* Top Right Badges */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <WeatherWidget placeName={plan.nameoftheplace} />
            {settings?.isPublished && (
              <span className="rounded-full bg-emerald-500/90 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white shadow-sm flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Public
              </span>
            )}
          </div>
        </div>

        {/* Content Over Cover */}
        <div className="relative px-6 pb-6 pt-2 sm:px-8 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                {formattedDates && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    {formattedDates}
                  </span>
                )}
                {settings?.companion && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1 capitalize">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    {settings.companion}
                  </span>
                )}
                {settings?.currencyCode && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1">
                    <CreditCard className="h-3.5 w-3.5 text-primary" />
                    {settings.currencyCode}
                  </span>
                )}
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                {plan.nameoftheplace}
              </h1>
            </div>

            {/* Quick Action Navigation */}
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm" className="rounded-full shadow-sm">
                <Link href={`/plans/${plan._id}/expense-tracker`}>
                  <CreditCard className="mr-1.5 h-3.5 w-3.5 text-primary" />
                  Expenses
                </Link>
              </Button>

              <Button asChild variant="outline" size="sm" className="rounded-full shadow-sm">
                <Link href={`/plans/${plan._id}/collaborate`}>
                  <Share2 className="mr-1.5 h-3.5 w-3.5 text-primary" />
                  Collaborate
                </Link>
              </Button>

              {isOwner && (
                <Button asChild variant="outline" size="sm" className="rounded-full shadow-sm">
                  <Link href={`/plans/${plan._id}/settings`}>
                    <Settings className="mr-1.5 h-3.5 w-3.5" />
                    Settings
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Activity preference tags */}
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

          {/* Real-time Streaming Generation Progress Indicator */}
          {!isAllReady && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3 mt-4">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-1.5 text-primary">
                  <Sparkles className="h-3.5 w-3.5 animate-spin" />
                  Crafting your custom travel guide...
                </span>
                <span className="font-semibold text-foreground">
                  {readyCount} of {totalCount} sections ready
                </span>
              </div>
              <Progress
                value={(readyCount / totalCount) * 100}
                className="h-2 bg-primary/20"
              />
              {isOwner && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-muted-foreground">
                    Sections are synthesized in background
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs rounded-full gap-1.5 border-primary/30 hover:bg-primary/10"
                    onClick={handleRetry}
                    disabled={isRetrying}
                  >
                    <Sparkles className="h-3 w-3 text-primary" />
                    {isRetrying ? "Resuming..." : "Resume Planning"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
