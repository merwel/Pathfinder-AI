import { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PlanPageClient } from "./PlanPageClient";

interface PageProps {
  params: {
    planId: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { getToken } = auth();
    const token = await getToken({ template: "convex" });
    if (token) {
      const data = await fetchQuery(
        api.plan.getPlan,
        { planId: params.planId as Id<"plan"> },
        { token }
      );
      if (data?.plan?.nameoftheplace) {
        return {
          title: `${data.plan.nameoftheplace} - Travel Plan`,
          description: `Comprehensive AI-generated travel guide and itinerary for ${data.plan.nameoftheplace}.`,
        };
      }
    }
  } catch {
    // Graceful fallback to default title
  }

  return {
    title: "Your Plan",
    description: "Personalized AI-powered travel plan and itinerary.",
  };
}

export default function PlanPage({ params }: PageProps) {
  return <PlanPageClient planId={params.planId} />;
}
