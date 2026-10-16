import { Compass, Sparkles, MapPin, Share2 } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Define Your Horizon",
    description:
      "Enter any city, coastal retreat, or mountain sanctuary worldwide. Choose your exact travel dates, travel companions, and preferred vibe.",
    icon: Compass,
  },
  {
    step: "02",
    title: "Intelligence in Motion",
    description:
      "Our AI streams in rich cultural stories, seasonal timing, top activities with exact locations, local cuisine secrets, and day-by-day morning-to-night pacing.",
    icon: Sparkles,
  },
  {
    step: "03",
    title: "Customize & Collaborate",
    description:
      "Tweak every activity with inline editing, track shared expenses across categories, invite traveling friends by email, and publish to the global community.",
    icon: Share2,
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 bg-sand-50/50 dark:bg-card/30 border-y border-border/60">
      <div className="container max-w-6xl px-4 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-terracotta-600 dark:text-terracotta-400 font-sans">
            The Philosophy of Effortless Travel
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
            How Pathfinder AI Crafts Your Journey
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Move beyond generic checklists. Experience an editorial travel planner that balances spontaneous discovery with meticulous day-by-day structure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="relative rounded-3xl border border-border/80 bg-background/80 p-8 shadow-sm hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-terracotta-500/10 text-terracotta-600 dark:text-terracotta-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="font-serif text-3xl font-light text-muted-foreground/40">
                    {s.step}
                  </span>
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground mb-2.5">
                  {s.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
