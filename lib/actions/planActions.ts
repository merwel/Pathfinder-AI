"use server";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { differenceInDays } from "date-fns";
import { api } from "@/convex/_generated/api";
import { CreatePlanFormSchema, CreatePlanFormValues } from "./schema";

function getConvexClient(token?: string | null) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured.");
  }
  const client = new ConvexHttpClient(convexUrl);
  if (token) {
    client.setAuth(token);
  }
  return client;
}

/**
 * Server action to generate an AI-powered travel plan.
 * Atomically validates form, checks credits, inserts empty plan, deducts credit,
 * awaits scheduling of 4 idempotent background jobs via retry helper, and redirects.
 */
export async function generatePlanAction(rawData: unknown) {
  // 1. Authenticate with Clerk & get Convex token
  const { userId, getToken } = auth();
  if (!userId) {
    throw new Error("Authentication required. Please sign in to plan a trip.");
  }

  const token = await getToken({ template: "convex" });
  if (!token) {
    throw new Error("Failed to retrieve authentication token for Convex.");
  }

  // 2. Validate form with Zod schema
  const validated = CreatePlanFormSchema.parse(rawData);

  // 3. Compute number of days strictly as differenceInDays(to, from) + 1
  const from = new Date(validated.fromDate);
  const to = new Date(validated.toDate);
  const noOfDays = Math.max(1, differenceInDays(to, from) + 1);

  const client = getConvexClient(token);

  // 4. Call atomic createPlan mutation
  const planId = await client.mutation(api.plan.createPlan, {
    placeName: validated.placeName,
    noOfDays,
    activityPreferences: validated.activityPreferences,
    fromDate: validated.fromDate,
    toDate: validated.toDate,
    companion: validated.companion,
    isGeneratedUsingAI: true,
  });

  // 5. Await scheduling of the 4 background idempotent jobs
  await client.mutation(api.plan.scheduleGenerationJobs, {
    planId,
  });

  // 6. Immediate redirect to plan page with progressive rendering
  redirect(`/plans/${planId}/plan?isNewPlan=true`);
}

/**
 * Server action to generate an empty travel plan.
 * Spends NO credit, is not AI rate-limited, sets all content flags true,
 * schedules only the image job, and redirects.
 */
export async function generateEmptyPlanAction(rawData: unknown) {
  // 1. Authenticate with Clerk & get Convex token
  const { userId, getToken } = auth();
  if (!userId) {
    throw new Error("Authentication required. Please sign in to create a trip.");
  }

  const token = await getToken({ template: "convex" });
  if (!token) {
    throw new Error("Failed to retrieve authentication token for Convex.");
  }

  // 2. Validate form
  const validated = CreatePlanFormSchema.parse(rawData);

  // 3. Compute number of days strictly as differenceInDays(to, from) + 1
  const from = new Date(validated.fromDate);
  const to = new Date(validated.toDate);
  const noOfDays = Math.max(1, differenceInDays(to, from) + 1);

  const client = getConvexClient(token);

  // 4. Call createPlan mutation with isGeneratedUsingAI: false
  const planId = await client.mutation(api.plan.createPlan, {
    placeName: validated.placeName,
    noOfDays,
    activityPreferences: validated.activityPreferences,
    fromDate: validated.fromDate,
    toDate: validated.toDate,
    companion: validated.companion,
    isGeneratedUsingAI: false,
  });

  // 5. Await scheduling of only the cover image job
  await client.mutation(api.plan.scheduleImageJobOnly, {
    planId,
  });

  // 6. Redirect to plan page for manual editing
  redirect(`/plans/${planId}/plan?isNewPlan=true`);
}
