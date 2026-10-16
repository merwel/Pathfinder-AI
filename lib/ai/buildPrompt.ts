import { format } from "date-fns";

export interface BuildPromptParams {
  destination: string;
  fromDate?: number; // epoch ms
  toDate?: number; // epoch ms
  noOfDays: number;
  companion?: string;
  activityPreferences?: string[];
  batch: 1 | 2 | 3;
}

/**
 * Pure helper function that constructs targeted AI generation prompts for each batch.
 * Never appends onto itself, never passes raw epoch numbers to the model.
 * Formats dates into human-readable strings (e.g. "12 Mar 2026").
 */
export function buildPrompt(params: BuildPromptParams): string {
  const {
    destination,
    fromDate,
    toDate,
    noOfDays,
    companion = "travelers",
    activityPreferences = [],
    batch,
  } = params;

  const formattedFrom = fromDate ? format(new Date(fromDate), "dd MMM yyyy") : "Upcoming season";
  const formattedTo = toDate ? format(new Date(toDate), "dd MMM yyyy") : "Upcoming season";
  const activitiesStr =
    activityPreferences.length > 0
      ? activityPreferences.join(", ")
      : "Sightseeing, Local culture, Scenic viewpoints";

  const contextHeader = [
    `Destination: ${destination}`,
    `Trip Duration: ${noOfDays} day(s)`,
    `Travel Window: ${formattedFrom} to ${formattedTo}`,
    `Travel Companion Type: ${companion}`,
    `Activity Preferences: ${activitiesStr}`,
  ].join("\n");

  switch (batch) {
    case 1:
      return `${contextHeader}

You are an expert travel journalist for a luxury travel magazine.
Generate Batch 1 of the trip plan for ${destination}:
1. "abouttheplace": A rich, evocative, and practical overview of ${destination}. It must be comprehensive and contain at least 50 words explaining the destination's history, vibe, geography, and distinct charm.
2. "besttimetovisit": Detailed advice on the optimal seasons, weather conditions, festival highlights, and crowd patterns for visiting ${destination}.

Return strictly valid JSON conforming to the requested schema.`;

    case 2:
      return `${contextHeader}

You are an expert local guide and culinary curator for ${destination}.
Generate Batch 2 of the trip plan tailored for ${companion} with interest in ${activitiesStr}:
1. "adventuresactivitiestodo": An array of at least 5 distinct, highly recommended activities or experiences. Each activity string MUST include its specific neighborhood or venue location (e.g. "Sunrise hike to Mount Batur (Kintamani) with a local breakfast").
2. "localcuisinerecommendations": An array of at least 4 authentic local dishes, street food specialties, or culinary drinks travelers must taste in ${destination}.
3. "packingchecklist": An array of at least 6 essential, destination-specific items to pack for a ${noOfDays}-day trip during ${formattedFrom} - ${formattedTo} (weather-appropriate gear, footwear, electrical adapters, cultural attire).

Return strictly valid JSON conforming to the requested schema.`;

    case 3:
      return `${contextHeader}

You are a master itinerary architect.
Generate Batch 3 of the trip plan for ${destination}:
1. "topplacestovisit": An array of at least 5 must-see landmarks, historical places, or natural sights. Each place must have its "name" and accurate real-world geographic coordinates ("lat" between -90 and 90, "lng" between -180 and 180).
2. "itinerary": An array of EXACTLY ${noOfDays} day(s).
   - Each day must have a "title" (e.g., "Day 1: Arrival & Historic Quarter Discovery").
   - Each day must have an "activities" object containing "morning", "afternoon", and "evening" arrays.
   - Each of "morning", "afternoon", and "evening" MUST contain at least one activity item with "itineraryItem" (title of activity) and "briefDescription" (concise practical guide with timing or tips).

Return strictly valid JSON conforming to the requested schema.`;
  }
}
