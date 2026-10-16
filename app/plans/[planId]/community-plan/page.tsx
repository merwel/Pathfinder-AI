import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PublicPlanClient } from "./PublicPlanClient";

interface PageProps {
  params: {
    planId: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const data = await fetchQuery(api.plan.getPublicPlan, {
      planId: params.planId as Id<"plan">,
    });
    if (data?.plan?.nameoftheplace) {
      return {
        title: `${data.plan.nameoftheplace} - Community Travel Guide`,
        description: `Explore the public AI-curated travel guide and itinerary for ${data.plan.nameoftheplace}.`,
      };
    }
  } catch {
    // fallback
  }

  return {
    title: "Community Travel Guide",
    description: "Curated multi-day community travel itinerary.",
  };
}

export default function CommunityPlanPage({ params }: PageProps) {
  return <PublicPlanClient planId={params.planId} />;
}
