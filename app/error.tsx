"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console
    console.error("Application error boundary triggered:", error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <div className="h-20 w-20 rounded-3xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 mb-6 shadow-sm">
        <AlertTriangle className="h-10 w-10" />
      </div>

      <span className="text-xs font-semibold uppercase tracking-widest text-red-600 dark:text-red-400 font-sans mb-2">
        Expedition Interrupted
      </span>
      <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground max-w-md">
        Something Unexpected Occurred
      </h1>
      <p className="mt-3 text-sm text-muted-foreground max-w-md leading-relaxed">
        We encountered an error while rendering this page. Our guides have been
        notified. You can attempt to reload or navigate back to safety.
      </p>

      {error?.message && (
        <div className="mt-4 max-w-md p-3 rounded-xl bg-muted/60 border border-border text-xs text-muted-foreground font-mono text-left overflow-auto max-h-32">
          {error.message}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => reset()} variant="default" className="gap-2 rounded-xl">
          <RefreshCw className="h-4 w-4" />
          <span>Try Again</span>
        </Button>
        <Link href="/">
          <Button variant="outline" className="gap-2 rounded-xl">
            <Home className="h-4 w-4" />
            <span>Return to Home</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
