"use client";

import React from "react";
import Link from "next/link";
import { Home, LayoutDashboard, Compass, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { cn } from "@/lib/utils";

interface TopUtilityBarProps {
  className?: string;
  backToPlanHref?: string;
  backToPlanLabel?: string;
  children?: React.ReactNode;
  rightContent?: React.ReactNode;
  showThemeToggle?: boolean;
}

export function TopUtilityBar({
  className,
  backToPlanHref,
  backToPlanLabel,
  children,
  rightContent,
  showThemeToggle = true,
}: TopUtilityBarProps) {
  return (
    <div
      className={cn(
        "border-b border-border/60 bg-card/75 backdrop-blur-md py-2 px-4 sm:px-8 sticky top-0 z-40 transition-colors shadow-xs",
        className
      )}
    >
      <div className="container max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar py-0.5">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 rounded-xl px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/70 font-medium shrink-0"
          >
            <Link href="/">
              <Home className="h-3.5 w-3.5 text-primary" />
              <span>Return to Home</span>
            </Link>
          </Button>

          <div className="h-4 w-px bg-border/70 shrink-0" />

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 rounded-xl px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/70 font-medium shrink-0"
          >
            <Link href="/dashboard">
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </Link>
          </Button>

          {backToPlanHref && (
            <>
              <div className="h-4 w-px bg-border/70 shrink-0" />
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 rounded-xl px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/70 font-medium shrink-0"
              >
                <Link href={backToPlanHref}>
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[140px] sm:max-w-[200px]">
                    {backToPlanLabel || "Back to Plan"}
                  </span>
                </Link>
              </Button>
            </>
          )}

          {children}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {rightContent}
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-serif font-bold tracking-tight text-foreground/80 hover:text-foreground transition-opacity"
          >
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-terracotta-500 to-amber-600 flex items-center justify-center text-white shadow-xs">
              <Compass className="h-3.5 w-3.5" />
            </div>
            <span>Pathfinder AI</span>
          </Link>
          {showThemeToggle && <ThemeToggle />}
        </div>
      </div>
    </div>
  );
}
