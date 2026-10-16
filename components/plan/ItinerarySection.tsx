"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  CalendarDays,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Sun,
  Sunset,
  Moon,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

// Form validation schema for adding a new day
const addDaySchema = z.object({
  title: z.string().min(2, "Day title is required (e.g., Day 4: Coastal Drive)"),
  morningItem: z.string().min(2, "Morning highlight is required"),
  morningDesc: z.string().min(5, "Morning description must be at least 5 characters"),
  afternoonItem: z.string().min(2, "Afternoon highlight is required"),
  afternoonDesc: z.string().min(5, "Afternoon description must be at least 5 characters"),
  eveningItem: z.string().min(2, "Evening highlight is required"),
  eveningDesc: z.string().min(5, "Evening description must be at least 5 characters"),
});

type AddDayFormValues = z.infer<typeof addDaySchema>;

interface ItineraryDay {
  title: string;
  activities: {
    morning: { itineraryItem: string; briefDescription: string }[];
    afternoon: { itineraryItem: string; briefDescription: string }[];
    evening: { itineraryItem: string; briefDescription: string }[];
  };
}

interface ItinerarySectionProps {
  planId: Id<"plan">;
  itinerary: ItineraryDay[];
  isReady: boolean;
  canEdit: boolean;
}

export function ItinerarySection({
  planId,
  itinerary,
  isReady,
  canEdit,
}: ItinerarySectionProps) {
  const addItineraryDayMutation = useMutation(api.plan.addItineraryDay);
  const deleteItineraryDayMutation = useMutation(api.plan.deleteItineraryDay);
  const updateItineraryMutation = useMutation(api.plan.updateItinerary);

  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({
    0: true, // first day expanded by default
  });
  const [isAddDayOpen, setIsAddDayOpen] = useState(false);
  const [dayToDelete, setDayToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Day state
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddDayFormValues>({
    resolver: zodResolver(addDaySchema),
    defaultValues: {
      title: "",
      morningItem: "",
      morningDesc: "",
      afternoonItem: "",
      afternoonDesc: "",
      eveningItem: "",
      eveningDesc: "",
    },
  });

  const toggleDay = (index: number) => {
    setExpandedDays((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleOpenAddDay = () => {
    const nextDayNum = itinerary.length + 1;
    reset({
      title: `Day ${nextDayNum}: Coastal & Cultural Discovery`,
      morningItem: "Morning Breakfast & Exploration",
      morningDesc: "Stroll around scenic viewpoints and enjoy traditional coffee.",
      afternoonItem: "Cultural Landmarks & Local Markets",
      afternoonDesc: "Immerse in local artisan markets and historic architecture.",
      eveningItem: "Sunset Lookout & Dining",
      eveningDesc: "Dine by the waterfront as the sun sets over the horizon.",
    });
    setIsAddDayOpen(true);
  };

  const onAddDaySubmit = async (data: AddDayFormValues) => {
    try {
      await addItineraryDayMutation({
        planId,
        title: data.title,
        morningItem: data.morningItem,
        morningDesc: data.morningDesc,
        afternoonItem: data.afternoonItem,
        afternoonDesc: data.afternoonDesc,
        eveningItem: data.eveningItem,
        eveningDesc: data.eveningDesc,
      });
      toast.success("New day added to itinerary!");
      setIsAddDayOpen(false);
      // Auto-expand the newly added day
      setExpandedDays((prev) => ({ ...prev, [itinerary.length]: true }));
    } catch (err: any) {
      toast.error(err?.message || "Failed to add day.");
    }
  };

  const confirmDeleteDay = async () => {
    if (dayToDelete === null) return;
    try {
      setIsDeleting(true);
      await deleteItineraryDayMutation({
        planId,
        dayIndex: dayToDelete,
      });
      toast.success("Day removed from itinerary.");
      setDayToDelete(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete day.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveDayTitle = async (dayIndex: number) => {
    if (!editTitle.trim()) return;
    try {
      const updated = [...itinerary];
      updated[dayIndex] = {
        ...updated[dayIndex],
        title: editTitle.trim(),
      };
      await updateItineraryMutation({
        planId,
        itinerary: updated,
      });
      toast.success("Day title updated!");
      setEditingDayIndex(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update day title.");
    }
  };

  return (
    <section id="itinerary" className="scroll-mt-24 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">
              Daily Itinerary
            </h2>
            <p className="text-xs text-muted-foreground">
              Morning, afternoon, and evening recommendations for each day
            </p>
          </div>
        </div>

        {canEdit && isReady && (
          <Button
            size="sm"
            onClick={handleOpenAddDay}
            className="rounded-full shadow-sm"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Day
          </Button>
        )}
      </div>

      {!isReady ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/50 bg-card p-6 space-y-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="space-y-3 pt-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : itinerary.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 p-8 text-center text-muted-foreground bg-card/40">
          <p className="text-sm">No daily itinerary scheduled yet.</p>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenAddDay}
              className="mt-3 rounded-full"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Day 1
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {itinerary.map((day, dayIndex) => {
            const isExpanded = !!expandedDays[dayIndex];
            const isEditingTitle = editingDayIndex === dayIndex;

            return (
              <div
                key={dayIndex}
                className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:border-primary/30"
              >
                {/* Day Header */}
                <div className="flex items-center justify-between bg-muted/30 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-mono text-xs font-bold">
                      {dayIndex + 1}
                    </span>
                    {isEditingTitle ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="h-8 text-sm font-semibold"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveDayTitle(dayIndex)}
                          className="h-8 rounded-full px-3 text-xs"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingDayIndex(null)}
                          className="h-8 text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-lg font-bold text-foreground">
                          {day.title}
                        </h3>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingDayIndex(dayIndex);
                              setEditTitle(day.title);
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {canEdit && itinerary.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDayToDelete(dayIndex);
                        }}
                        title="Delete Day"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => toggleDay(dayIndex)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Day Activities Slots */}
                {isExpanded && (
                  <div className="divide-y divide-border/40 p-5 space-y-4">
                    {/* Morning */}
                    <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-start sm:gap-6">
                      <div className="flex items-center gap-2 sm:w-32 shrink-0">
                        <Sun className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Morning
                        </span>
                      </div>
                      <div className="flex-1 space-y-2">
                        {day.activities.morning.map((act, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl bg-muted/20 p-3 border border-border/40"
                          >
                            <h4 className="text-sm font-semibold text-foreground">
                              {act.itineraryItem}
                            </h4>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {act.briefDescription}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Afternoon */}
                    <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:items-start sm:gap-6">
                      <div className="flex items-center gap-2 sm:w-32 shrink-0">
                        <Sunset className="h-4 w-4 text-orange-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Afternoon
                        </span>
                      </div>
                      <div className="flex-1 space-y-2">
                        {day.activities.afternoon.map((act, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl bg-muted/20 p-3 border border-border/40"
                          >
                            <h4 className="text-sm font-semibold text-foreground">
                              {act.itineraryItem}
                            </h4>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {act.briefDescription}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Evening */}
                    <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:items-start sm:gap-6">
                      <div className="flex items-center gap-2 sm:w-32 shrink-0">
                        <Moon className="h-4 w-4 text-indigo-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Evening
                        </span>
                      </div>
                      <div className="flex-1 space-y-2">
                        {day.activities.evening.map((act, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl bg-muted/20 p-3 border border-border/40"
                          >
                            <h4 className="text-sm font-semibold text-foreground">
                              {act.itineraryItem}
                            </h4>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {act.briefDescription}
                            </p>
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
      )}

      {/* Add Day Dialog with Zod Form */}
      <Dialog open={isAddDayOpen} onOpenChange={setIsAddDayOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              Add Day to Itinerary
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onAddDaySubmit)} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Day Title
              </label>
              <Input
                {...register("title")}
                placeholder="e.g. Day 4: Mountain Temples & Rice Terraces"
                className="mt-1"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Morning fields */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
                <Sun className="h-4 w-4" /> Morning
              </div>
              <Input
                {...register("morningItem")}
                placeholder="Morning Activity Name"
                className="text-xs"
              />
              {errors.morningItem && (
                <p className="text-xs text-destructive">{errors.morningItem.message}</p>
              )}
              <Textarea
                {...register("morningDesc")}
                placeholder="Morning Description"
                rows={2}
                className="text-xs resize-none"
              />
              {errors.morningDesc && (
                <p className="text-xs text-destructive">{errors.morningDesc.message}</p>
              )}
            </div>

            {/* Afternoon fields */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-500 uppercase tracking-wider">
                <Sunset className="h-4 w-4" /> Afternoon
              </div>
              <Input
                {...register("afternoonItem")}
                placeholder="Afternoon Activity Name"
                className="text-xs"
              />
              {errors.afternoonItem && (
                <p className="text-xs text-destructive">{errors.afternoonItem.message}</p>
              )}
              <Textarea
                {...register("afternoonDesc")}
                placeholder="Afternoon Description"
                rows={2}
                className="text-xs resize-none"
              />
              {errors.afternoonDesc && (
                <p className="text-xs text-destructive">{errors.afternoonDesc.message}</p>
              )}
            </div>

            {/* Evening fields */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                <Moon className="h-4 w-4" /> Evening
              </div>
              <Input
                {...register("eveningItem")}
                placeholder="Evening Activity Name"
                className="text-xs"
              />
              {errors.eveningItem && (
                <p className="text-xs text-destructive">{errors.eveningItem.message}</p>
              )}
              <Textarea
                {...register("eveningDesc")}
                placeholder="Evening Description"
                rows={2}
                className="text-xs resize-none"
              />
              {errors.eveningDesc && (
                <p className="text-xs text-destructive">{errors.eveningDesc.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDayOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-full">
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Add Day to Itinerary"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Day Confirmation */}
      <AlertDialog
        open={dayToDelete !== null}
        onOpenChange={(open) => !open && setDayToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this itinerary day?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove Day {(dayToDelete ?? 0) + 1} from your plan?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDay}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Day"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
