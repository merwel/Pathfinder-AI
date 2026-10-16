"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import {
  Settings,
  Globe,
  Trash2,
  Save,
  Loader2,
  Calendar,
  Users,
  CreditCard,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopUtilityBar } from "@/components/shared/TopUtilityBar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SectionNavPills } from "@/components/plan/SectionNavPills";
import Link from "next/link";
import currencies from "@/lib/currencies.json";

const COMPANIONS = [
  { id: "solo", label: "Solo Explorer" },
  { id: "couple", label: "Couple" },
  { id: "family", label: "Family with Kids" },
  { id: "friends", label: "Friends Group" },
];

const AVAILABLE_PREFERENCES = [
  "Culture & Art",
  "Food & Dining",
  "Adventure & Outdoors",
  "Relaxation & Wellness",
  "Nature & Wildlife",
  "Beach & Water",
  "Nightlife & Music",
  "History & Heritage",
  "Shopping & Markets",
  "Photography",
];

interface PlanSettingsClientProps {
  planId: string;
}

export function PlanSettingsClient({ planId }: PlanSettingsClientProps) {
  const router = useRouter();

  const data = useQuery(api.plan.getPlan, {
    planId: planId as Id<"plan">,
  });

  const updateSettingsMutation = useMutation(api.plan.updatePlanSettings);
  const togglePublishMutation = useMutation(api.plan.togglePublish);
  const deletePlanMutation = useMutation(api.plan.deletePlan);

  // Form states
  const [placeName, setPlaceName] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [companion, setCompanion] = useState("solo");
  const [fromDateStr, setFromDateStr] = useState("");
  const [toDateStr, setToDateStr] = useState("");
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Sync state when data loads
  useEffect(() => {
    if (data?.plan && data?.settings) {
      setPlaceName(data.plan.nameoftheplace);
      setCurrencyCode(data.settings.currencyCode || "USD");
      setCompanion(data.settings.companion || "solo");
      setSelectedPrefs(data.settings.activityPreferences || []);

      if (data.settings.fromDate) {
        setFromDateStr(new Date(data.settings.fromDate).toISOString().split("T")[0]);
      }
      if (data.settings.toDate) {
        setToDateStr(new Date(data.settings.toDate).toISOString().split("T")[0]);
      }
    }
  }, [data]);

  const togglePref = (pref: string) => {
    setSelectedPrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeName.trim()) {
      toast.error("Destination name cannot be empty.");
      return;
    }

    try {
      setIsSaving(true);
      const fromEpoch = fromDateStr ? new Date(fromDateStr).getTime() : undefined;
      const toEpoch = toDateStr ? new Date(toDateStr).getTime() : undefined;

      await updateSettingsMutation({
        planId: planId as Id<"plan">,
        nameoftheplace: placeName.trim(),
        currencyCode,
        companion,
        activityPreferences: selectedPrefs,
        fromDate: fromEpoch,
        toDate: toEpoch,
      });

      toast.success("Trip settings updated successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    try {
      setIsTogglingPublish(true);
      const newStatus = await togglePublishMutation({
        planId: planId as Id<"plan">,
      });
      toast.success(
        newStatus
          ? "Your trip is now publicly published to the Community Showcase!"
          : "Your trip is now private."
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to update publish status.");
    } finally {
      setIsTogglingPublish(false);
    }
  };

  const confirmDeletePlan = async () => {
    try {
      setIsDeleting(true);
      await deletePlanMutation({
        planId: planId as Id<"plan">,
      });
      toast.success("Trip plan deleted permanently.");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete plan.");
      setIsDeleting(false);
    }
  };

  if (data === undefined) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopUtilityBar />
        <div className="container max-w-4xl px-4 py-8 space-y-6 sm:px-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopUtilityBar />
        <div className="container max-w-md px-4 py-20 text-center space-y-4">
          <h2 className="font-serif text-2xl font-bold">Trip Not Found</h2>
          <p className="text-sm text-muted-foreground">
            You don&apos;t have permission to edit settings for this plan, or it has been removed.
          </p>
          <Button asChild className="rounded-full">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!data.isOwner) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopUtilityBar
          backToPlanHref={`/plans/${planId}/plan`}
          backToPlanLabel={`Back to ${data.plan.nameoftheplace} Plan`}
        />
        <div className="container max-w-md px-4 py-20 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold">Owner Access Required</h2>
          <p className="text-sm text-muted-foreground">
            Only the creator of this travel plan can adjust currency, publishing, or deletion settings.
          </p>
          <Button asChild className="rounded-full">
            <Link href={`/plans/${planId}/plan`}>Back to Plan</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isPublished = !!data.settings?.isPublished;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Utility Bar with Return to Home, Dashboard & Back to Plan */}
      <TopUtilityBar
        backToPlanHref={`/plans/${planId}/plan`}
        backToPlanLabel={`Back to ${data.plan.nameoftheplace} Plan`}
      />

      {/* Sticky Navigation Pills */}
      <SectionNavPills
        planId={planId}
        activeSection="settings"
        onSectionClick={() => {}}
        isOwner={true}
      />

      <div className="container max-w-4xl px-4 sm:px-8 pt-6 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
            >
              <Home className="h-3.5 w-3.5 text-primary" /> Return to Home
            </Link>
            <span className="text-muted-foreground/40">&bull;</span>
            <Link
              href={`/plans/${planId}/plan`}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to {data.plan.nameoftheplace} Plan
            </Link>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground mt-1">
            Trip Settings & Preferences
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage trip destination details, currency, travel preferences, and community visibility
          </p>
        </div>

        {/* 1. General Plan Information Form */}
        <form
          onSubmit={handleSaveSettings}
          className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-2.5 border-b border-border/50 pb-3">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-lg font-bold text-foreground">
              General Trip Details
            </h2>
          </div>

          <div className="space-y-4">
            {/* Destination Name */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Destination Name
              </label>
              <Input
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                placeholder="e.g. Kyoto, Japan"
                className="mt-1.5 rounded-xl text-sm"
                required
              />
            </div>

            {/* Currency & Companion Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Preferred Currency
                </label>
                <Select value={currencyCode} onValueChange={setCurrencyCode}>
                  <SelectTrigger className="mt-1.5 rounded-xl text-sm">
                    <SelectValue placeholder="Select Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        {curr.code} ({curr.symbol}) - {curr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Companion Type
                </label>
                <Select value={companion} onValueChange={setCompanion}>
                  <SelectTrigger className="mt-1.5 rounded-xl text-sm">
                    <SelectValue placeholder="Select Companion" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANIONS.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Travel Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  From Date
                </label>
                <Input
                  type="date"
                  value={fromDateStr}
                  onChange={(e) => setFromDateStr(e.target.value)}
                  className="mt-1.5 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  To Date
                </label>
                <Input
                  type="date"
                  value={toDateStr}
                  onChange={(e) => setToDateStr(e.target.value)}
                  className="mt-1.5 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Activity Preferences Multi-select */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Activity Preferences
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {AVAILABLE_PREFERENCES.map((pref) => {
                  const isSelected = selectedPrefs.includes(pref);
                  return (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => togglePref(pref)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border border-border/70 bg-muted/40 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {pref}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isSaving}
              className="rounded-full px-6 shadow-sm"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="mr-1.5 h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </form>

        {/* 2. Community Publishing Card */}
        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-2.5">
              <Globe className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-serif text-lg font-bold text-foreground">
                  Community Showcase
                </h2>
                <p className="text-xs text-muted-foreground">
                  Publish your curated itinerary so fellow travelers can discover it
                </p>
              </div>
            </div>
            {isPublished && (
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Published
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <p className="text-sm font-medium text-foreground">
                {isPublished ? "Public Visibility Active" : "Private Trip Plan"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isPublished
                  ? "Anyone with the public link can browse your guide without editing access."
                  : "Only you and invited collaborators can view this travel plan."}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isPublished && (
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link
                    href={`/plans/${planId}/community-plan`}
                    target="_blank"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Public View
                  </Link>
                </Button>
              )}

              <Button
                variant={isPublished ? "outline" : "default"}
                size="sm"
                onClick={handleTogglePublish}
                disabled={isTogglingPublish}
                className="rounded-full"
              >
                {isTogglingPublish ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPublished ? (
                  "Unpublish Trip"
                ) : (
                  "Publish to Community"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* 3. Danger Zone */}
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-destructive/20 pb-3">
            <Trash2 className="h-5 w-5 text-destructive" />
            <h2 className="font-serif text-lg font-bold text-destructive">
              Danger Zone
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Permanently Delete Plan
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                This will delete your itinerary, stored cover photo, logged expenses, collaborator access, and invites.
              </p>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="rounded-full shrink-0"
            >
              Delete Plan
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete &quot;{data.plan.nameoftheplace}&quot;
              and all associated data from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePlan}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Permanently Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
