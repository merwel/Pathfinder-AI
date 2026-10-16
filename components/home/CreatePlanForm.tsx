"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { Autocomplete } from "@react-google-maps/api";
import { format, addDays } from "date-fns";
import {
  MapPin,
  Calendar,
  Sparkles,
  Users,
  Compass,
  FilePlus,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMapContext } from "@/contexts/MapProvider";
import { COMPANION_TYPES, ACTIVITY_PREFERENCES } from "@/lib/constants";
import { generatePlanAction, generateEmptyPlanAction } from "@/lib/actions/planActions";
import { cn } from "@/lib/utils";

interface CreatePlanFormProps {
  onSuccess?: () => void;
  className?: string;
  isModal?: boolean;
}

export function CreatePlanForm({ className, isModal = false }: CreatePlanFormProps) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { isLoaded: isMapLoaded } = useMapContext();

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Form state
  const [destination, setDestination] = useState("");
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const defaultToDateStr = format(addDays(new Date(), 3), "yyyy-MM-dd");

  const [fromDateStr, setFromDateStr] = useState(todayStr);
  const [toDateStr, setToDateStr] = useState(defaultToDateStr);
  const [selectedCompanion, setSelectedCompanion] = useState("partner");
  const [selectedActivities, setSelectedActivities] = useState<string[]>([
    "Historic Landmarks & Culture",
    "Foodie & Fine Dining",
  ]);

  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isLoadingEmpty, setIsLoadingEmpty] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePlaceSelect = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place && place.formatted_address) {
        setDestination(place.formatted_address);
      } else if (place && place.name) {
        setDestination(place.name);
      }
    }
  };

  const toggleActivity = (label: string) => {
    setSelectedActivities((prev) =>
      prev.includes(label) ? prev.filter((a) => a !== label) : [...prev, label]
    );
  };

  const handleSubmit = async (isAi: boolean) => {
    setErrorMessage(null);

    if (!destination.trim()) {
      setErrorMessage("Please enter a destination to explore.");
      return;
    }

    const fromDate = new Date(fromDateStr).getTime();
    const toDate = new Date(toDateStr).getTime();

    if (isNaN(fromDate) || isNaN(toDate)) {
      setErrorMessage("Please choose valid travel dates.");
      return;
    }

    if (toDate < fromDate) {
      setErrorMessage("Return date must be on or after the departure date.");
      return;
    }

    const payload = {
      placeName: destination.trim(),
      fromDate,
      toDate,
      companion: selectedCompanion,
      activityPreferences: selectedActivities,
    };

    try {
      if (isAi) {
        setIsLoadingAi(true);
        await generatePlanAction(payload);
      } else {
        setIsLoadingEmpty(true);
        await generateEmptyPlanAction(payload);
      }
    } catch (err: any) {
      console.error("Submission failed:", err);
      setErrorMessage(
        err?.message || "Failed to initiate trip planning. Please check your credentials or try again."
      );
      setIsLoadingAi(false);
      setIsLoadingEmpty(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-3xl border border-border/80 bg-card/95 p-6 sm:p-8 shadow-2xl backdrop-blur-md transition-all",
        className
      )}
    >
      {errorMessage && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 animate-in fade-in-50">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      <div className="space-y-6">
        {/* Destination Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans mb-2 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-terracotta-500" />
            <span>Where do you want to wander?</span>
          </label>
          {isMapLoaded ? (
            <Autocomplete
              onLoad={(autocomplete) => {
                autocompleteRef.current = autocomplete;
              }}
              onPlaceChanged={handlePlaceSelect}
            >
              <Input
                type="text"
                placeholder="e.g. Kyoto, Japan or Florence, Italy"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="h-12 text-base rounded-2xl bg-background border-border/80 pl-4 shadow-sm"
              />
            </Autocomplete>
          ) : (
            <Input
              type="text"
              placeholder="e.g. Kyoto, Japan or Florence, Italy"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="h-12 text-base rounded-2xl bg-background border-border/80 pl-4 shadow-sm"
            />
          )}
        </div>

        {/* Date Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans mb-2 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-terracotta-500" />
              <span>Departure Date</span>
            </label>
            <Input
              type="date"
              min={todayStr}
              value={fromDateStr}
              onChange={(e) => {
                setFromDateStr(e.target.value);
                if (new Date(e.target.value) > new Date(toDateStr)) {
                  setToDateStr(e.target.value);
                }
              }}
              className="h-11 rounded-xl bg-background border-border/80 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans mb-2 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-terracotta-500" />
              <span>Return Date</span>
            </label>
            <Input
              type="date"
              min={fromDateStr || todayStr}
              value={toDateStr}
              onChange={(e) => setToDateStr(e.target.value)}
              className="h-11 rounded-xl bg-background border-border/80 shadow-sm"
            />
          </div>
        </div>

        {/* Companion Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans mb-2 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-terracotta-500" />
            <span>Traveling With</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {COMPANION_TYPES.map((type) => {
              const isSelected = selectedCompanion === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedCompanion(type.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all duration-200 cursor-pointer",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary"
                      : "border-border/80 bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="text-xs font-semibold leading-tight">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Activity Preferences Multi-select */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans mb-2 flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-terracotta-500" />
            <span>Trip Highlights & Interests</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_PREFERENCES.map((activity) => {
              const isChecked = selectedActivities.includes(activity.label);
              return (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => toggleActivity(activity.label)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer",
                    isChecked
                      ? "bg-terracotta-500 text-white border-terracotta-600 shadow-sm"
                      : "bg-background/80 hover:bg-muted text-muted-foreground border-border/80"
                  )}
                >
                  {isChecked && <Check className="h-3 w-3" />}
                  <span>{activity.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          {isSignedIn ? (
            <>
              <Button
                type="button"
                variant="terracotta"
                size="lg"
                onClick={() => handleSubmit(true)}
                disabled={isLoadingAi || isLoadingEmpty}
                className="w-full sm:flex-1 h-13 rounded-2xl text-base shadow-lg hover:shadow-xl font-medium gap-2"
              >
                {isLoadingAi ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Orchestrating Trip...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>Generate AI Itinerary</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => handleSubmit(false)}
                disabled={isLoadingAi || isLoadingEmpty}
                className="w-full sm:w-auto h-13 rounded-2xl text-sm font-medium border-border/80 hover:bg-muted gap-2"
              >
                {isLoadingEmpty ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating Plan...</span>
                  </>
                ) : (
                  <>
                    <FilePlus className="h-4 w-4 text-terracotta-500" />
                    <span>Create Blank Plan</span>
                  </>
                )}
              </Button>
            </>
          ) : (
            <SignInButton mode="modal">
              <Button
                type="button"
                variant="terracotta"
                size="lg"
                className="w-full h-13 rounded-2xl text-base shadow-lg hover:shadow-xl font-medium gap-2"
              >
                <Sparkles className="h-5 w-5" />
                <span>Sign In to Generate Travel Plan</span>
              </Button>
            </SignInButton>
          )}
        </div>
      </div>
    </div>
  );
}
