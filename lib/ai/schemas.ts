import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

/**
 * Word count helper to ensure at least 50 words in abouttheplace.
 */
function countWords(str: string): number {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

// -----------------------------------------------------------------------------
// BATCH 1 SCHEMA: About Destination & Best Time To Visit
// -----------------------------------------------------------------------------
export const Batch1Schema = z.object({
  abouttheplace: z
    .string()
    .min(100, "abouttheplace description is too short")
    .refine((val) => countWords(val) >= 50, {
      message: "abouttheplace must contain at least 50 words",
    }),
  besttimetovisit: z
    .string()
    .min(20, "besttimetovisit must contain at least 20 characters"),
});

export type Batch1Data = z.infer<typeof Batch1Schema>;

// -----------------------------------------------------------------------------
// BATCH 2 SCHEMA: Activities, Local Cuisines & Packing Checklist
// -----------------------------------------------------------------------------
export const Batch2Schema = z.object({
  adventuresactivitiestodo: z
    .array(z.string().min(5, "Activity title too short"))
    .min(5, "Must include at least 5 adventures and activities to do"),
  localcuisinerecommendations: z
    .array(z.string().min(3, "Cuisine recommendation too short"))
    .min(3, "Must include at least 3 local cuisine recommendations"),
  packingchecklist: z
    .array(z.string().min(2, "Packing checklist item too short"))
    .min(4, "Must include at least 4 packing checklist items"),
});

export type Batch2Data = z.infer<typeof Batch2Schema>;

// -----------------------------------------------------------------------------
// BATCH 3 SCHEMA: Top Places with Coordinates & Day-by-Day Itinerary
// -----------------------------------------------------------------------------
export const ItineraryActivityItemSchema = z.object({
  itineraryItem: z.string().min(3, "Activity item name must be at least 3 characters"),
  briefDescription: z
    .string()
    .min(10, "Brief description must be at least 10 characters"),
});

export const TopPlaceItemSchema = z.object({
  name: z.string().min(2, "Place name is required"),
  coordinates: z.object({
    lat: z
      .number()
      .min(-90, "Latitude must be >= -90")
      .max(90, "Latitude must be <= 90"),
    lng: z
      .number()
      .min(-180, "Longitude must be >= -180")
      .max(180, "Longitude must be <= 180"),
  }),
});

export function createBatch3Schema(expectedDays: number) {
  return z.object({
    topplacestovisit: z
      .array(TopPlaceItemSchema)
      .min(5, "Must include at least 5 top places to visit with real coordinates"),
    itinerary: z
      .array(
        z.object({
          title: z.string().min(3, "Day title is required"),
          activities: z.object({
            morning: z
              .array(ItineraryActivityItemSchema)
              .min(1, "Morning must have at least 1 activity"),
            afternoon: z
              .array(ItineraryActivityItemSchema)
              .min(1, "Afternoon must have at least 1 activity"),
            evening: z
              .array(ItineraryActivityItemSchema)
              .min(1, "Evening must have at least 1 activity"),
          }),
        })
      )
      .length(expectedDays, `Itinerary must contain EXACTLY ${expectedDays} day(s)`),
  });
}

export type Batch3Data = {
  topplacestovisit: Array<{
    name: string;
    coordinates: { lat: number; lng: number };
  }>;
  itinerary: Array<{
    title: string;
    activities: {
      morning: Array<{ itineraryItem: string; briefDescription: string }>;
      afternoon: Array<{ itineraryItem: string; briefDescription: string }>;
      evening: Array<{ itineraryItem: string; briefDescription: string }>;
    };
  }>;
};

// -----------------------------------------------------------------------------
// JSON Schema Converters for LLMs
// -----------------------------------------------------------------------------
export function getBatch1JsonSchema(): Record<string, unknown> {
  const fullSchema = zodToJsonSchema(Batch1Schema, {
    target: "openApi3",
    $refStrategy: "none",
  });
  return fullSchema as Record<string, unknown>;
}

export function getBatch2JsonSchema(): Record<string, unknown> {
  const fullSchema = zodToJsonSchema(Batch2Schema, {
    target: "openApi3",
    $refStrategy: "none",
  });
  return fullSchema as Record<string, unknown>;
}

export function getBatch3JsonSchema(expectedDays: number): Record<string, unknown> {
  const fullSchema = zodToJsonSchema(createBatch3Schema(expectedDays), {
    target: "openApi3",
    $refStrategy: "none",
  });
  return fullSchema as Record<string, unknown>;
}
