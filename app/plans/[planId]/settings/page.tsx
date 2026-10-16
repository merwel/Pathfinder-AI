import { Metadata } from "next";
import { PlanSettingsClient } from "./PlanSettingsClient";

interface PageProps {
  params: {
    planId: string;
  };
}

export const metadata: Metadata = {
  title: "Trip Settings",
  description: "Configure trip preferences, preferred currency, and publishing visibility.",
};

export default function PlanSettingsPage({ params }: PageProps) {
  return <PlanSettingsClient planId={params.planId} />;
}
