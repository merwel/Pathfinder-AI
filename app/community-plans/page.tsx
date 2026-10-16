import { Metadata } from "next";
import { CommunityPlansClient } from "./CommunityPlansClient";

export const metadata: Metadata = {
  title: "Community Travel Guides | Pathfinder AI",
  description: "Browse publicly shared travel itineraries and AI-generated guides from our global explorer community.",
};

export default function CommunityPlansPage() {
  return <CommunityPlansClient />;
}
