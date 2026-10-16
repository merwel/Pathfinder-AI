import Link from "next/link";
import { Compass, Sparkles, MapPin, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/80 bg-background/50 backdrop-blur-sm mt-auto">
      <div className="container px-4 py-12 sm:px-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-terracotta-500 to-amber-600 flex items-center justify-center text-white shadow-sm">
                <Compass className="h-4 w-4" />
              </div>
              <span className="font-serif text-lg font-bold tracking-tight">
                Pathfinder<span className="text-terracotta-600 dark:text-terracotta-400">AI</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Curating thoughtful, magazine-quality travel itineraries powered by
              modern artificial intelligence and real-time place intelligence.
            </p>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans">
              Discover
            </h4>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link
                  href="/community-plans"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Community Itineraries
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  My Journeys
                </Link>
              </li>
              <li>
                <Link
                  href="/community-plans"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Explore Community
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans">
              Experience
            </h4>
            <div className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-terracotta-500" />
                <span>Gemini Structured Output</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-terracotta-500" />
                <span>Google Maps Platform</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-terracotta-500" />
                <span>Editorial Aesthetic Design</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/60 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>© {new Date().getFullYear()} Pathfinder AI. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Crafted for travelers who seek thoughtful adventures.
          </p>
        </div>
      </div>
    </footer>
  );
}
