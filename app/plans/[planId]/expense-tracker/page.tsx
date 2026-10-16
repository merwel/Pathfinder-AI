import { Metadata } from "next";
import { ExpenseTrackerClient } from "./ExpenseTrackerClient";

interface PageProps {
  params: {
    planId: string;
  };
}

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Track shared travel expenses, group budgets, and category breakdowns.",
};

export default function ExpenseTrackerPage({ params }: PageProps) {
  return <ExpenseTrackerClient planId={params.planId} />;
}
