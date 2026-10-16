"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import {
  MessageSquarePlus,
  Send,
  Loader2,
  Bug,
  Lightbulb,
  HelpCircle,
  AlertCircle,
  Sparkles,
  HelpCircle as OtherIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FEEDBACK_LABELS = [
  { id: "idea", label: "Idea / Suggestion", icon: Lightbulb, color: "text-amber-500" },
  { id: "featurerequest", label: "Feature Request", icon: Sparkles, color: "text-primary" },
  { id: "issue", label: "Issue / Bug", icon: Bug, color: "text-destructive" },
  { id: "question", label: "Question", icon: HelpCircle, color: "text-blue-500" },
  { id: "complaint", label: "Complaint", icon: AlertCircle, color: "text-orange-500" },
  { id: "other", label: "Other", icon: OtherIcon, color: "text-muted-foreground" },
] as const;

type FeedbackLabel = (typeof FEEDBACK_LABELS)[number]["id"];

interface FeedbackSheetProps {
  planId?: string;
  triggerButton?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function FeedbackSheet({
  planId,
  triggerButton,
  isOpen: controlledOpen,
  onOpenChange: setControlledOpen,
}: FeedbackSheetProps) {
  const { isSignedIn } = useAuth();
  const submitFeedbackMutation = useMutation(api.feedback.submitFeedback);

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isSheetOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const handleOpenChange = setControlledOpen || setUncontrolledOpen;

  const [label, setLabel] = useState<FeedbackLabel>("idea");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      toast.error("Please sign in to send feedback.");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter a feedback message.");
      return;
    }

    try {
      setIsSubmitting(true);
      await submitFeedbackMutation({
        message: message.trim(),
        label,
        planId: planId as any,
      });

      toast.success("Thank you! Your feedback has been received.");
      setMessage("");
      handleOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {triggerButton || (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            <span>Feedback</span>
          </Button>
        )}
      </SheetTrigger>

      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-serif text-xl">Share Your Feedback</SheetTitle>
          <SheetDescription className="text-xs">
            Help us improve Pathfinder AI. We read every bug report, idea, and feature suggestion.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-6">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Feedback Category
            </label>
            <Select
              value={label}
              onValueChange={(val) => setLabel(val as FeedbackLabel)}
            >
              <SelectTrigger className="mt-1.5 rounded-xl text-xs">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {FEEDBACK_LABELS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SelectItem key={item.id} value={item.id} className="text-xs">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                        <span>{item.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your Message
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what you loved, what could be improved, or an idea for a feature..."
              rows={5}
              className="mt-1.5 rounded-xl text-xs resize-none"
              required
            />
          </div>

          {planId && (
            <div className="rounded-xl bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
              Context: This feedback will be attached to your current travel itinerary.
            </div>
          )}

          <SheetFooter className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="w-full rounded-full"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Submit Feedback
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
