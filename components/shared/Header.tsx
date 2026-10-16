"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Sparkles,
  MessageSquarePlus,
  PlusCircle,
  Home,
  LayoutDashboard,
  Globe,
} from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { FeedbackSheet } from "@/components/shared/FeedbackSheet";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onOpenFeedback?: () => void;
  credits?: { credits: number; freeCredits: number };
}

export function Header({ onOpenFeedback, credits }: HeaderProps) {
  const pathname = usePathname();

  const totalCredits = (credits?.freeCredits ?? 0) + (credits?.credits ?? 0);

  return (
    <header className="sticky top-0 z-40 w-full glass-nav">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-terracotta-500 to-amber-600 flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
              <Compass className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold tracking-tight text-foreground">
                Pathfinder<span className="text-terracotta-600 dark:text-terracotta-400">AI</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground -mt-1 font-medium hidden sm:inline">
                Editorial Travel
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-1.5 pl-1 sm:pl-2">
            <Link
              href="/"
              className={cn(
                "px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors hover:text-foreground inline-flex items-center gap-1.5",
                pathname === "/"
                  ? "bg-secondary text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground"
              )}
            >
              <Home className="h-3.5 w-3.5 text-primary" />
              <span>Home</span>
            </Link>

            <Link
              href="/dashboard"
              className={cn(
                "px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors hover:text-foreground inline-flex items-center gap-1.5",
                pathname.startsWith("/dashboard")
                  ? "bg-secondary text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground"
              )}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/community-plans"
              className={cn(
                "hidden md:inline-flex px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors hover:text-foreground items-center gap-1.5",
                pathname.startsWith("/community-plans")
                  ? "bg-secondary text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground"
              )}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Explore Community</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="hidden sm:inline-flex">
            <FeedbackSheet />
          </div>

          <SignedIn>
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-sand-100 dark:bg-sand-900/40 text-sand-800 dark:text-sand-300 border border-sand-300/40 dark:border-sand-700/40 text-xs font-medium"
              title="Unlimited AI Travel Planning"
            >
              <Sparkles className="h-3.5 w-3.5 text-terracotta-500" />
              <span className="font-semibold text-foreground">Unlimited Trips</span>
            </div>

            <Link href="/dashboard" className="hidden sm:inline-flex">
              <Button
                variant="terracotta"
                size="sm"
                className="gap-1.5 text-xs rounded-xl shadow-sm"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>New Trip</span>
              </Button>
            </Link>

            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9 ring-2 ring-terracotta-500/30",
                },
              }}
            />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="default" size="sm" className="rounded-xl text-xs font-medium">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
