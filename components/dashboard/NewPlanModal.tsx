"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CreatePlanForm } from "@/components/home/CreatePlanForm";

interface NewPlanModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewPlanModal({ isOpen, onOpenChange }: NewPlanModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader className="mb-4 text-left">
          <DialogTitle className="text-2xl font-serif">Curate a New Voyage</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Enter your destination and dates. Our AI will craft your day-by-day itinerary and recommendations.
          </DialogDescription>
        </DialogHeader>

        <CreatePlanForm isModal onSuccess={() => onOpenChange(false)} className="border-0 shadow-none p-0 bg-transparent" />
      </DialogContent>
    </Dialog>
  );
}
