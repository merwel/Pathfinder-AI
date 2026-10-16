"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { Compass, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const grantAccess = useMutation(api.invites.grantAccessByToken);

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoaded) return;

    if (!isSignedIn) {
      // User must sign in first to verify their email
      return;
    }

    if (!token) {
      setStatus("error");
      setErrorMessage("No invitation token was provided in the URL.");
      return;
    }

    let isMounted = true;

    async function claimInvite() {
      try {
        const result = await grantAccess({ token: token! });
        if (isMounted) {
          setStatus("success");
          setTimeout(() => {
            router.push(`/plans/${result.planId}/plan`);
          }, 1500);
        }
      } catch (err: any) {
        if (isMounted) {
          setStatus("error");
          setErrorMessage(
            err?.message || "Failed to accept the trip invitation. It may be invalid or expired."
          );
        }
      }
    }

    claimInvite();

    return () => {
      isMounted = false;
    };
  }, [isAuthLoaded, isSignedIn, token, grantAccess, router]);

  if (!isAuthLoaded) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-terracotta-500 mb-3" />
        <p className="text-sm text-muted-foreground">Verifying invitation credentials...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl border border-border/80 bg-card text-center shadow-xl">
        <div className="h-16 w-16 rounded-3xl bg-terracotta-500/10 text-terracotta-600 dark:text-terracotta-400 flex items-center justify-center mx-auto mb-4">
          <Compass className="h-8 w-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
          You&apos;re Invited on a Journey
        </h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Please sign in to verify your email address and join your team&apos;s trip itinerary.
        </p>
        <SignInButton mode="modal">
          <Button variant="terracotta" className="w-full h-11 rounded-xl text-sm font-medium">
            Sign In to Accept Invite
          </Button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-16 p-8 rounded-3xl border border-border/80 bg-card text-center shadow-xl">
      {status === "loading" && (
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-terracotta-500 mb-4" />
          <h2 className="font-serif text-2xl font-bold text-foreground mb-1">
            Accepting Expedition Invitation
          </h2>
          <p className="text-xs text-muted-foreground">
            Verifying email credentials and unlocking trip access...
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center animate-in fade-in-50">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
          <h2 className="font-serif text-2xl font-bold text-foreground mb-1">
            Welcome to the Expedition!
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            You now have collaborator access. Redirecting you to the itinerary...
          </p>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center animate-in fade-in-50">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
            Unable to Join Trip
          </h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            {errorMessage}
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            variant="outline"
            className="rounded-xl text-xs font-medium"
          >
            Go to Your Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}

export default function JoinPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 container max-w-4xl px-4 py-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-16">
              <Loader2 className="h-8 w-8 animate-spin text-terracotta-500" />
            </div>
          }
        >
          <JoinContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
