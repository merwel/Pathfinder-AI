"use client";

import React, { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import {
  Luggage,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Check,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface PackingSectionProps {
  planId: Id<"plan">;
  checklist: string[];
  isReady: boolean;
  canEdit: boolean;
}

export function PackingSection({
  planId,
  checklist,
  isReady,
  canEdit,
}: PackingSectionProps) {
  const updatePackingList = useMutation(api.plan.updatePackingList);

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Restore checked items from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`packing_${planId}`);
      if (stored) {
        setCheckedItems(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, [planId]);

  const toggleCheck = (item: string) => {
    setCheckedItems((prev) => {
      const updated = { ...prev, [item]: !prev[item] };
      try {
        localStorage.setItem(`packing_${planId}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    try {
      setIsSaving(true);
      const updated = [...checklist, newItem.trim()];
      await updatePackingList({
        planId,
        packingchecklist: updated,
      });
      toast.success("Packing item added!");
      setNewItem("");
      setIsAddOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to add item.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async (index: number) => {
    if (!editingText.trim()) return;

    try {
      setIsSaving(true);
      const updated = [...checklist];
      updated[index] = editingText.trim();
      await updatePackingList({
        planId,
        packingchecklist: updated,
      });
      toast.success("Packing item updated!");
      setEditingIndex(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update item.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (index: number) => {
    try {
      const updated = checklist.filter((_, i) => i !== index);
      await updatePackingList({
        planId,
        packingchecklist: updated,
      });
      toast.success("Item removed from packing list.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove item.");
    }
  };

  const packedCount = checklist.filter((item) => checkedItems[item]).length;

  return (
    <section id="packing" className="scroll-mt-24 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Luggage className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">
                Packing Checklist
              </h2>
              {isReady && checklist.length > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {packedCount}/{checklist.length} packed
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Essentials tailored to your destination and climate
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
            Add Item
          </Button>
        )}
      </div>

      {!isReady ? (
        <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3"
            >
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : checklist.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 p-8 text-center text-muted-foreground bg-card/40">
          <p className="text-sm">No packing items listed yet.</p>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="mt-3 rounded-full"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add First Item
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
          {checklist.map((item, index) => {
            const isEditingThis = editingIndex === index;
            const isChecked = !!checkedItems[item];

            return (
              <div
                key={index}
                className={`group flex items-center justify-between rounded-xl border p-3 shadow-sm transition-all ${
                  isChecked
                    ? "border-primary/30 bg-primary/[0.03] text-muted-foreground"
                    : "border-border/60 bg-card hover:border-primary/40 hover:shadow-md"
                }`}
              >
                {isEditingThis ? (
                  <div className="flex w-full items-center gap-2">
                    <Input
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(index)}
                      disabled={isSaving}
                      className="h-8 rounded-full px-2.5"
                    >
                      {isSaving ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingIndex(null)}
                      disabled={isSaving}
                      className="h-8 px-2"
                    >
                      ✕
                    </Button>
                  </div>
                ) : (
                  <>
                    <label
                      htmlFor={`pack-item-${index}`}
                      className="flex flex-1 cursor-pointer items-center gap-3 overflow-hidden"
                    >
                      <Checkbox
                        id={`pack-item-${index}`}
                        checked={isChecked}
                        onCheckedChange={() => toggleCheck(item)}
                        className="data-[state=checked]:bg-primary"
                      />
                      <span
                        className={`truncate text-sm font-medium ${
                          isChecked ? "line-through text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {item}
                      </span>
                    </label>

                    {canEdit && (
                      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingIndex(index);
                            setEditingText(item);
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(index)}
                        >
                          <Trash2 className="h-3 w-3" />
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

      {/* Add Item Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Add Packing Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Item Description
              </label>
              <Input
                placeholder="e.g. Reef-safe sunscreen SPF 50+"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
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
              <Button type="submit" disabled={isSaving || !newItem.trim()}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
