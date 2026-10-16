"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Info,
  MapPin,
  Calendar,
  Compass,
  UtensilsCrossed,
  Luggage,
  Receipt,
  Users,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionNavPillsProps {
  planId: string;
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
  isOwner?: boolean;
}

export function SectionNavPills({
  planId,
  activeSection,
  onSectionClick,
  isOwner = false,
}: SectionNavPillsProps) {
  const pathname = usePathname();
  const isMainPlanView = pathname.endsWith("/plan");

  const sections = [
    { id: "about", label: "Overview", icon: Info },
    { id: "places", label: "Places & Map", icon: MapPin },
    { id: "itinerary", label: "Itinerary", icon: Calendar },
    { id: "activities", label: "Activities", icon: Compass },
    { id: "cuisines", label: "Cuisine", icon: UtensilsCrossed },
    { id: "packing", label: "Packing List", icon: Luggage },
  ];

  return (
    <div className="sticky top-16 z-30 w-full bg-background/90 backdrop-blur-md border-b border-border/70 py-2.5">
      <div className="container max-w-6xl px-4 sm:px-8 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        {/* In-page section anchor pills (only when on the /plan view) */}
        {isMainPlanView ? (
          <div className="flex items-center gap-1.5 shrink-0">
            {sections.map((s) => {
              const Icon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onSectionClick(s.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap",
                    isActive
                      ? "bg-terracotta-500 text-white shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <Link
            href={`/plans/${planId}/plan`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-terracotta-600 hover:text-terracotta-700 bg-sand-100 dark:bg-card shrink-0"
          >
            <span>← Back to Plan</span>
          </Link>
        )}

        {/* Route navigation tabs (Expenses, Collaborate, Settings) */}
        <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-border/80">
          <Link
            href={`/plans/${planId}/expense-tracker`}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap",
              pathname.includes("/expense-tracker")
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
            )}
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>Expenses</span>
          </Link>

          <Link
            href={`/plans/${planId}/collaborate`}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap",
              pathname.includes("/collaborate")
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
            )}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Collaborate</span>
          </Link>

          {isOwner && (
            <Link
              href={`/plans/${planId}/settings`}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap",
                pathname.includes("/settings")
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              )}
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Settings</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
