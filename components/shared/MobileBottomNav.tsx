"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, MapPin, Sparkles, PlusCircle } from "lucide-react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();

  // If on a plan page, the plan view will have top-anchored pills and mobile drawer
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border/80 bg-background/90 backdrop-blur-lg px-4 py-2">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center gap-1 text-[11px] font-medium transition-colors",
            pathname === "/" ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </Link>

        <Link
          href="/community-plans"
          className={cn(
            "flex flex-col items-center gap-1 text-[11px] font-medium transition-colors",
            pathname.startsWith("/community-plans") ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Compass className="h-5 w-5" />
          <span>Explore</span>
        </Link>

        <SignedIn>
          <Link
            href="/dashboard"
            className="flex flex-col items-center -mt-5"
          >
            <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-terracotta-600 to-terracotta-500 flex items-center justify-center text-white shadow-lg border-4 border-background">
              <PlusCircle className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-semibold text-primary mt-1">Plan</span>
          </Link>

          <Link
            href="/dashboard"
            className={cn(
              "flex flex-col items-center gap-1 text-[11px] font-medium transition-colors",
              pathname === "/dashboard" ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MapPin className="h-5 w-5" />
            <span>My Trips</span>
          </Link>
        </SignedIn>

        <SignedOut>
          <SignInButton mode="modal">
            <button className="flex flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground">
              <Sparkles className="h-5 w-5 text-terracotta-500" />
              <span>Sign In</span>
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    </div>
  );
}
