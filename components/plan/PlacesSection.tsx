"use client";

import React, { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Autocomplete } from "@react-google-maps/api";
import { toast } from "sonner";
import { MapPin, Plus, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanMap } from "@/components/plan/PlanMap";
import { useMapContext } from "@/contexts/MapProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface PlaceItem {
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface PlacesSectionProps {
  planId: Id<"plan">;
  places: PlaceItem[];
  destinationName: string;
  isReady: boolean;
  canEdit: boolean;
}

export function PlacesSection({
  planId,
  places,
  destinationName,
  isReady,
  canEdit,
}: PlacesSectionProps) {
  const updateTopPlaces = useMutation(api.plan.updateTopPlaces);
  const { isLoaded: isMapLoaded } = useMapContext();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [placeNameDraft, setPlaceNameDraft] = useState("");
  const [latDraft, setLatDraft] = useState<number | "">("");
  const [lngDraft, setLngDraft] = useState<number | "">("");
  const [isSaving, setIsSaving] = useState(false);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const handlePlaceSelect = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place && place.name) {
        setPlaceNameDraft(place.name);
      }
      if (place && place.geometry?.location) {
        setLatDraft(place.geometry.location.lat());
        setLngDraft(place.geometry.location.lng());
      }
    }
  };

  const handleAddPlace = async () => {
    if (!placeNameDraft.trim()) {
      toast.error("Please enter a place name.");
      return;
    }

    const lat = typeof latDraft === "number" ? latDraft : parseFloat(String(latDraft));
    const lng = typeof lngDraft === "number" ? lngDraft : parseFloat(String(lngDraft));

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error("Please provide valid latitude (-90 to 90) and longitude (-180 to 180).");
      return;
    }

    const updated = [
      ...places,
      {
        name: placeNameDraft.trim(),
        coordinates: { lat, lng },
      },
    ];

    try {
      setIsSaving(true);
      await updateTopPlaces({
        planId,
        topplacestovisit: updated,
      });
      toast.success(`Added ${placeNameDraft} to top places!`);
      setPlaceNameDraft("");
      setLatDraft("");
      setLngDraft("");
      setAddDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to add place.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlace = async (indexToDelete: number) => {
    const updated = places.filter((_, idx) => idx !== indexToDelete);
    try {
      await updateTopPlaces({
        planId,
        topplacestovisit: updated,
      });
      toast.success("Place removed.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove place.");
    }
  };

  if (!isReady) {
    return (
      <div id="places" className="space-y-4 pt-10">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-[380px] w-full rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-20 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section id="places" className="pt-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-terracotta-600 dark:text-terracotta-400 font-sans">
            Geography & Landmarks
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
            Top Places & Interactive Map
          </h2>
        </div>

        {canEdit && (
          <Button
            onClick={() => setAddDialogOpen(true)}
            variant="outline"
            size="sm"
            className="rounded-xl gap-1.5 text-xs font-medium border-border/80"
          >
            <Plus className="h-3.5 w-3.5 text-terracotta-500" />
            <span>Add Place</span>
          </Button>
        )}
      </div>

      {/* Interactive Map */}
      <PlanMap places={places} destinationName={destinationName} />

      {/* Grid of Places Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {places.map((place, idx) => (
          <div
            key={idx}
            className="group rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:shadow-md transition-all flex items-start justify-between gap-3"
          >
            <div className="flex items-start gap-3 truncate">
              <div className="h-8 w-8 rounded-xl bg-terracotta-500/10 text-terracotta-600 dark:text-terracotta-400 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="truncate">
                <h4 className="font-semibold text-xs sm:text-sm text-foreground truncate">
                  {place.name}
                </h4>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  {place.coordinates.lat.toFixed(4)}, {place.coordinates.lng.toFixed(4)}
                </p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    place.name + " " + destinationName
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-terracotta-600 dark:text-terracotta-400 hover:underline mt-1.5 font-medium"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            </div>

            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeletePlace(idx)}
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                title="Delete place"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add Place Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader className="text-left">
            <DialogTitle>Add Place to Itinerary</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Place Name
              </label>
              {isMapLoaded ? (
                <Autocomplete
                  onLoad={(auto) => {
                    autocompleteRef.current = auto;
                  }}
                  onPlaceChanged={handlePlaceSelect}
                >
                  <Input
                    placeholder="Search place with Google Autocomplete..."
                    value={placeNameDraft}
                    onChange={(e) => setPlaceNameDraft(e.target.value)}
                    className="rounded-xl text-sm"
                  />
                </Autocomplete>
              ) : (
                <Input
                  placeholder="e.g. Fushimi Inari Shrine"
                  value={placeNameDraft}
                  onChange={(e) => setPlaceNameDraft(e.target.value)}
                  className="rounded-xl text-sm"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Latitude
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 34.9671"
                  value={latDraft}
                  onChange={(e) => setLatDraft(e.target.value ? parseFloat(e.target.value) : "")}
                  className="rounded-xl text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Longitude
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 135.7727"
                  value={lngDraft}
                  onChange={(e) => setLngDraft(e.target.value ? parseFloat(e.target.value) : "")}
                  className="rounded-xl text-sm font-mono"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPlace}
              disabled={isSaving}
              variant="terracotta"
              className="rounded-xl text-xs gap-1.5"
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save Place</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
