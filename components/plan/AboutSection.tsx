"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Edit3, Sparkles, Sun, Compass, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface AboutSectionProps {
  planId: Id<"plan">;
  abouttheplace: string;
  besttimetovisit: string;
  isReady: boolean;
  canEdit: boolean;
}

export function AboutSection({
  planId,
  abouttheplace,
  besttimetovisit,
  isReady,
  canEdit,
}: AboutSectionProps) {
  const updateAbout = useMutation(api.plan.updateAbout);

  const [isEditing, setIsEditing] = useState(false);
  const [aboutDraft, setAboutDraft] = useState(abouttheplace);
  const [bestTimeDraft, setBestTimeDraft] = useState(besttimetovisit);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenEdit = () => {
    setAboutDraft(abouttheplace);
    setBestTimeDraft(besttimetovisit);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateAbout({
        planId,
        abouttheplace: aboutDraft.trim(),
        besttimetovisit: bestTimeDraft.trim(),
      });
      toast.success("Overview updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update overview.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isReady) {
    return (
      <div id="about" className="space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-16 w-3/4 rounded-xl" />
      </div>
    );
  }

  return (
    <section id="about" className="pt-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-terracotta-600 dark:text-terracotta-400 font-sans">
            Destination Essence
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
            About the Place
          </h2>
        </div>

        {canEdit && (
          <Button
            onClick={handleOpenEdit}
            variant="outline"
            size="sm"
            className="rounded-xl gap-1.5 text-xs font-medium border-border/80"
          >
            <Edit3 className="h-3.5 w-3.5 text-terracotta-500" />
            <span>Edit</span>
          </Button>
        )}
      </div>

      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <p className="text-sm sm:text-base text-foreground/90 leading-relaxed font-sans font-light">
          {abouttheplace || "No overview provided yet. Click Edit to write an introduction."}
        </p>

        {besttimetovisit && (
          <div className="pt-5 border-t border-border/60 flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                Best Time to Visit & Climate Notes
              </h4>
              <p className="text-xs sm:text-sm text-foreground/80 mt-1 leading-relaxed">
                {besttimetovisit}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-lg rounded-3xl p-6">
          <DialogHeader className="text-left">
            <DialogTitle>Edit Overview & Timing</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                About the Place
              </label>
              <Textarea
                rows={6}
                value={aboutDraft}
                onChange={(e) => setAboutDraft(e.target.value)}
                className="rounded-xl text-sm leading-relaxed"
                placeholder="Write about the history, vibe, and culture..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Best Time to Visit
              </label>
              <Textarea
                rows={3}
                value={bestTimeDraft}
                onChange={(e) => setBestTimeDraft(e.target.value)}
                className="rounded-xl text-sm"
                placeholder="Seasonal highlights, weather windows..."
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              variant="terracotta"
              className="rounded-xl text-xs gap-1.5"
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save Changes</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
