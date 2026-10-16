"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import {
  Compass,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Sparkles,
  MapPin,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ActivitiesSectionProps {
  planId: Id<"plan">;
  activities: string[];
  isReady: boolean;
  canEdit: boolean;
}

export function ActivitiesSection({
  planId,
  activities,
  isReady,
  canEdit,
}: ActivitiesSectionProps) {
  const updateActivities = useMutation(api.plan.updateActivities);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newActivity, setNewActivity] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.trim()) return;

    try {
      setIsSaving(true);
      const updated = [...activities, newActivity.trim()];
      await updateActivities({
        planId,
        adventuresactivitiestodo: updated,
      });
      toast.success("Activity added!");
      setNewActivity("");
      setIsAddOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to add activity.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async (index: number) => {
    if (!editingText.trim()) return;

    try {
      setIsSaving(true);
      const updated = [...activities];
      updated[index] = editingText.trim();
      await updateActivities({
        planId,
        adventuresactivitiestodo: updated,
      });
      toast.success("Activity updated!");
      setEditingIndex(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update activity.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (index: number) => {
    try {
      const updated = activities.filter((_, i) => i !== index);
      await updateActivities({
        planId,
        adventuresactivitiestodo: updated,
      });
      toast.success("Activity removed.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove activity.");
    }
  };

  return (
    <section id="activities" className="scroll-mt-24 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">
              Adventures & Activities
            </h2>
            <p className="text-xs text-muted-foreground">
              Curated experiences and bucket-list items
            </p>
          </div>
        </div>

        {canEdit && isReady && (
          <Button
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="rounded-full shadow-sm"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Activity
          </Button>
        )}
      </div>

      {!isReady ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/50 bg-card p-4 space-y-2 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 p-8 text-center text-muted-foreground bg-card/40">
          <p className="text-sm">No activities listed yet.</p>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="mt-3 rounded-full"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add First Activity
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {activities.map((act, index) => {
            const isEditingThis = editingIndex === index;

            return (
              <div
                key={index}
                className="group relative flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                {isEditingThis ? (
                  <div className="space-y-3">
                    <Input
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="text-sm"
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingIndex(null)}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(index)}
                        disabled={isSaving}
                        className="rounded-full"
                      >
                        {isSaving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Check className="mr-1 h-3.5 w-3.5" /> Save
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-mono text-xs font-semibold">
                        {index + 1}
                      </div>
                      <p className="text-sm font-medium leading-relaxed text-foreground">
                        {act}
                      </p>
                    </div>

                    {canEdit && (
                      <div className="mt-3 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingIndex(index);
                            setEditingText(act);
                          }}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Activity Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Add New Activity</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddActivity} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Activity Details & Location
              </label>
              <Input
                placeholder="e.g. Scuba dive at Blue Lagoon Reef, Sanur"
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                className="mt-1.5"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || !newActivity.trim()}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
