"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Check, ChevronsUpDown, MapPin, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface PlanSwitcherProps {
  currentPlanId: string;
  currentPlanName?: string;
}

export function PlanSwitcher({ currentPlanId, currentPlanName = "Select Trip" }: PlanSwitcherProps) {
  const router = useRouter();
  const allPlans = useQuery(api.plan.getAllUserPlansForSwitcher);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 max-w-[220px] sm:max-w-[280px] rounded-xl px-3 text-xs justify-between bg-card/85 backdrop-blur-md border-border/80 shadow-sm"
        >
          <div className="flex items-center gap-1.5 truncate">
            <Compass className="h-3.5 w-3.5 text-terracotta-500 shrink-0" />
            <span className="truncate font-serif font-semibold">{currentPlanName}</span>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 ml-1 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 rounded-2xl p-1.5 shadow-xl">
        <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase font-sans tracking-widest px-2 py-1">
          Switch Journey
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {allPlans && allPlans.length > 0 ? (
          allPlans.map((item: any) => {
            const isCurrent = item._id === currentPlanId;
            return (
              <DropdownMenuItem
                key={item._id}
                onClick={() => {
                  if (!isCurrent) {
                    router.push(`/plans/${item._id}/plan`);
                  }
                }}
                className={cn(
                  "flex items-center justify-between text-xs py-2 px-2.5 rounded-xl cursor-pointer",
                  isCurrent && "bg-accent font-semibold text-accent-foreground"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="h-3.5 w-3.5 text-terracotta-500 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </div>
                {isCurrent && <Check className="h-3.5 w-3.5 text-terracotta-600 shrink-0" />}
                {item.isShared && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 ml-1">
                    Shared
                  </span>
                )}
              </DropdownMenuItem>
            );
          })
        ) : (
          <div className="p-3 text-center text-xs text-muted-foreground">
            No other trips found.
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
