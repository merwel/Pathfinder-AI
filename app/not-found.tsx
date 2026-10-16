import Link from "next/link";
import { Compass, MoveLeft, MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <div className="relative mb-6">
        <div className="h-24 w-24 rounded-3xl bg-sand-100 dark:bg-sand-900/30 flex items-center justify-center text-terracotta-600 dark:text-terracotta-400 border border-sand-300 dark:border-sand-800 shadow-sm">
          <MapPinOff className="h-12 w-12" />
        </div>
        <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-xl bg-terracotta-500 text-white flex items-center justify-center shadow-md">
          <Compass className="h-4 w-4 animate-spin" style={{ animationDuration: "12s" }} />
        </div>
      </div>

      <span className="text-xs font-semibold uppercase tracking-widest text-terracotta-600 dark:text-terracotta-400 font-sans mb-2">
        Coordinates Not Found (404)
      </span>
      <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground max-w-md">
        This Destination Is Off the Map
      </h1>
      <p className="mt-3 text-sm text-muted-foreground max-w-md leading-relaxed">
        We couldn&apos;t find the itinerary or page you&apos;re looking for. It might have
        been moved, deleted, or set to private.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/">
          <Button variant="default" className="gap-2 rounded-xl">
            <MoveLeft className="h-4 w-4" />
            <span>Return Home</span>
          </Button>
        </Link>
        <Link href="/community-plans">
          <Button variant="outline" className="rounded-xl">
            Explore Community Trips
          </Button>
        </Link>
      </div>
    </div>
  );
}
