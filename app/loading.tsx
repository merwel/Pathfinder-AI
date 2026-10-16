import { Compass } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="relative mb-4">
        <div className="h-16 w-16 rounded-2xl bg-terracotta-50 dark:bg-terracotta-950/40 flex items-center justify-center text-terracotta-600 dark:text-terracotta-400 border border-terracotta-200 dark:border-terracotta-800 animate-pulse">
          <Compass className="h-8 w-8 animate-spin" style={{ animationDuration: "8s" }} />
        </div>
      </div>
      <p className="font-serif text-lg font-medium text-foreground">
        Plotting your coordinates...
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Gathering maps, itineraries, and travel intelligence
      </p>
    </div>
  );
}
