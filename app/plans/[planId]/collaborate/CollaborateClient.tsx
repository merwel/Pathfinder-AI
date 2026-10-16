"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import {
  Users,
  Mail,
  UserPlus,
  Trash2,
  Loader2,
  Clock,
  CheckCircle2,
  ShieldCheck,
  LogOut,
  Copy,
  ExternalLink,
  ArrowLeft,
  AlertCircle,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopUtilityBar } from "@/components/shared/TopUtilityBar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

interface CollaborateClientProps {
  planId: string;
}

export function CollaborateClient({ planId }: CollaborateClientProps) {
  const router = useRouter();

  const planData = useQuery(api.plan.getPlan, {
    planId: planId as Id<"plan">,
  });

  const sendInviteAction = useAction(api.sendInvite.sendInvite);
  const revokeInviteMutation = useMutation(api.invites.revokeInvite);
  const revokeAccessMutation = useMutation(api.invites.revokeAccess);
  const leavePlanMutation = useMutation(api.plan.leavePlan);

  // Invites and collaborators queries (only active for owner)
  const isOwner = planData?.isOwner ?? false;
  const invites = useQuery(
    api.invites.getPlanInvites,
    isOwner ? { planId: planId as Id<"plan"> } : "skip"
  );
  const collaborators = useQuery(
    api.invites.getPlanCollaborators,
    isOwner ? { planId: planId as Id<"plan"> } : "skip"
  );

  const [inviteEmail, setInviteEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [simulatedLink, setSimulatedLink] = useState<string | null>(null);

  // Revoke states
  const [accessToRevoke, setAccessToRevoke] = useState<{
    id: Id<"access">;
    email: string;
  } | null>(null);
  const [inviteToRevoke, setInviteToRevoke] = useState<Id<"invites"> | null>(
    null
  );
  const [isRevoking, setIsRevoking] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    try {
      setIsSending(true);
      setSimulatedLink(null);

      const res = await sendInviteAction({
        planId: planId as Id<"plan">,
        email,
      });

      if (res?.simulated && res.joinUrl) {
        setSimulatedLink(res.joinUrl);
        toast.info("Invite created! (Email delivery simulated locally)");
      } else {
        toast.success(`Invitation successfully sent to ${email}!`);
      }
      setInviteEmail("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send invitation.");
    } finally {
      setIsSending(false);
    }
  };

  const copySimulatedLink = () => {
    if (simulatedLink) {
      navigator.clipboard.writeText(simulatedLink);
      toast.success("Join link copied to clipboard!");
    }
  };

  const confirmRevokeInvite = async () => {
    if (!inviteToRevoke) return;
    try {
      setIsRevoking(true);
      await revokeInviteMutation({
        inviteId: inviteToRevoke,
        planId: planId as Id<"plan">,
      });
      toast.success("Invitation revoked.");
      setInviteToRevoke(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to revoke invitation.");
    } finally {
      setIsRevoking(false);
    }
  };

  const confirmRevokeAccess = async () => {
    if (!accessToRevoke) return;
    try {
      setIsRevoking(true);
      await revokeAccessMutation({
        accessId: accessToRevoke.id,
        planId: planId as Id<"plan">,
      });
      toast.success(`Removed access for ${accessToRevoke.email}.`);
      setAccessToRevoke(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove collaborator.");
    } finally {
      setIsRevoking(false);
    }
  };

  const confirmLeavePlan = async () => {
    try {
      setIsLeaving(true);
      await leavePlanMutation({
        planId: planId as Id<"plan">,
      });
      toast.success("You have left this trip.");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err?.message || "Failed to leave trip.");
      setIsLeaving(false);
    }
  };

  if (planData === undefined) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopUtilityBar />
        <div className="container max-w-4xl px-4 py-8 space-y-6 sm:px-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-60 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (planData === null) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopUtilityBar />
        <div className="container max-w-md px-4 py-24 text-center space-y-4">
          <h2 className="font-serif text-2xl font-bold">Trip Not Found</h2>
          <p className="text-sm text-muted-foreground">
            You don&apos;t have permission to collaborate on this plan, or it has been removed.
          </p>
          <Button asChild className="rounded-full">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Utility Bar with Return to Home, Dashboard & Back to Plan */}
      <TopUtilityBar
        backToPlanHref={`/plans/${planId}/plan`}
        backToPlanLabel={`Back to ${planData.plan.nameoftheplace} Plan`}
      />

      {/* Sticky Navigation Pills */}
      <SectionNavPills
        planId={planId}
        activeSection="collaborate"
        onSectionClick={() => {}}
        isOwner={isOwner}
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
              <ArrowLeft className="h-3.5 w-3.5" /> Back to {planData.plan.nameoftheplace} Plan
            </Link>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground mt-1">
            Trip Collaboration & Sharing
          </h1>
          <p className="text-xs text-muted-foreground">
            Invite fellow travelers to coordinate activities, recommend dining, and log group expenses
          </p>
        </div>

        {/* Invite by Email Card (Owner Only) */}
        {isOwner ? (
          <div className="rounded-3xl border border-primary/30 bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-foreground">
                  Invite a Travel Companion
                </h2>
                <p className="text-xs text-muted-foreground">
                  Send an email invitation. Rate limit: 10 per day per user, 3 per plan per day.
                </p>
              </div>
            </div>

            <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="companion@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="pl-9 rounded-xl text-sm"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isSending || !inviteEmail.trim()}
                className="rounded-full px-6 shadow-sm"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Mail className="mr-1.5 h-4 w-4" /> Send Invite
                  </>
                )}
              </Button>
            </form>

            {/* Simulated link alert */}
            {simulatedLink && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4" /> Simulated Join Link (Local Environment)
                </div>
                <p className="text-muted-foreground">
                  Since RESEND_API_KEY is not configured on the server, copy this link to simulate claiming the invitation:
                </p>
                <div className="flex items-center gap-2">
                  <Input value={simulatedLink} readOnly className="h-8 text-xs font-mono" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copySimulatedLink}
                    className="h-8 rounded-lg shrink-0"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copy Link
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Collaborator Status
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    You have active editing and expense management permissions on this shared trip.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLeaveDialog(true)}
                className="text-destructive hover:bg-destructive/10 rounded-full text-xs"
              >
                <LogOut className="mr-1.5 h-3.5 w-3.5" /> Leave Trip
              </Button>
            </div>
          </div>
        )}

        {/* Section 1: Active Collaborators List */}
        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <h2 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Active Collaborators
            </h2>
            <span className="text-xs text-muted-foreground">
              {(collaborators?.length || 0) + 1} with access
            </span>
          </div>

          <div className="divide-y divide-border/40">
            {/* Trip Owner */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                  👑
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <span>Trip Owner</span>
                    <Badge variant="outline" className="text-[10px] font-normal border-primary/30 text-primary">
                      Owner
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">Full administration permissions</span>
                </div>
              </div>
            </div>

            {/* Other Collaborators */}
            {collaborators && collaborators.length > 0 ? (
              collaborators.map((c: any) => (
                <div key={c._id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold text-xs text-muted-foreground">
                      {c.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {c.name}
                      </div>
                      <span className="text-xs text-muted-foreground">{c.email}</span>
                    </div>
                  </div>

                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAccessToRevoke({ id: c._id, email: c.email })}
                      className="text-xs text-muted-foreground hover:text-destructive rounded-full"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Revoke
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-xs text-muted-foreground">
                No external collaborators have joined this trip yet.
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Pending Invitations (Owner Only) */}
        {isOwner && (
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h2 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Pending Invitations
              </h2>
              <span className="text-xs text-muted-foreground">
                {invites?.length || 0} awaiting acceptance
              </span>
            </div>

            <div className="divide-y divide-border/40">
              {invites && invites.length > 0 ? (
                invites.map((inv: any) => (
                  <div key={inv._id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 font-bold text-xs">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {inv.email}
                        </div>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          Token: {inv.token.slice(0, 12)}...
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setInviteToRevoke(inv._id)}
                      className="text-xs text-muted-foreground hover:text-destructive rounded-full"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Cancel Invite
                    </Button>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  No pending invitations.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Revoke Invite Confirmation */}
      <AlertDialog
        open={inviteToRevoke !== null}
        onOpenChange={(open) => !open && setInviteToRevoke(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this pending invitation? The recipient will not be able to join the trip.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRevokeInvite}
              disabled={isRevoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRevoking ? "Cancelling..." : "Cancel Invitation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Access Confirmation */}
      <AlertDialog
        open={accessToRevoke !== null}
        onOpenChange={(open) => !open && setAccessToRevoke(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Collaborator?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke editing and expense access for &quot;{accessToRevoke?.email}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRevokeAccess}
              disabled={isRevoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRevoking ? "Removing..." : "Remove Access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Plan Confirmation */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this shared trip?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove your collaborator access to &quot;{planData.plan.nameoftheplace}&quot;?
              You will no longer be able to edit this plan or view private expenses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLeaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLeavePlan}
              disabled={isLeaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLeaving ? "Leaving..." : "Leave Trip"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
