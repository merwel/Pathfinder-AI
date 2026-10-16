import { Metadata } from "next";
import { CollaborateClient } from "./CollaborateClient";

interface PageProps {
  params: {
    planId: string;
  };
}

export const metadata: Metadata = {
  title: "Trip Collaboration",
  description: "Invite travel companions by email, manage collaborator access, and coordinate plans.",
};

export default function CollaboratePage({ params }: PageProps) {
  return <CollaborateClient planId={params.planId} />;
}
