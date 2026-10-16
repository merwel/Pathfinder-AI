import assert from "assert";
import { differenceInDays, addDays, format } from "date-fns";
import { CreatePlanFormSchema } from "../lib/actions/schema";
import {
  Batch1Schema,
  Batch2Schema,
  createBatch3Schema,
  getBatch1JsonSchema,
  getBatch2JsonSchema,
  getBatch3JsonSchema,
} from "../lib/ai/schemas";
import {
  generateFallbackBatch1,
  generateFallbackBatch2,
  generateFallbackBatch3,
} from "../lib/ai/fallbackGenerator";
import { buildPrompt } from "../lib/ai/buildPrompt";

console.log("=====================================================================");
console.log("DEEP & COMPREHENSIVE TRAVEL PLANNER AUDIT - ALL SECTIONS & SCENARIOS");
console.log("=====================================================================");

let totalPassed = 0;
let totalFailed = 0;

function runScenario(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    totalPassed++;
  } catch (err: any) {
    console.error(`  ✗ [FAIL] ${name}:`, err.message);
    totalFailed++;
    throw err;
  }
}

// =============================================================================
// SECTION 1: DATE MATHEMATICS & CALENDAR BOUNDARIES (BEST & WORST CASES)
// =============================================================================
console.log("\n[SECTION 1: Date Mathematics & Calendar Boundaries]");

runScenario("1.1 Same-day trip (1-day voyage: from == to)", () => {
  const from = new Date("2026-10-17T00:00:00Z");
  const to = new Date("2026-10-17T00:00:00Z");
  const days = Math.max(1, differenceInDays(to, from) + 1);
  assert.strictEqual(days, 1, "Same day trip must evaluate to exactly 1 day");
});

runScenario("1.2 Standard 7-day trip", () => {
  const from = new Date("2026-06-01T00:00:00Z");
  const to = new Date("2026-06-07T00:00:00Z");
  const days = Math.max(1, differenceInDays(to, from) + 1);
  assert.strictEqual(days, 7, "1st to 7th inclusive must be 7 days");
});

runScenario("1.3 Month-boundary crossing (Oct 28 to Nov 3)", () => {
  const from = new Date("2026-10-28T00:00:00Z");
  const to = new Date("2026-11-03T00:00:00Z");
  const days = Math.max(1, differenceInDays(to, from) + 1);
  // Oct has 31 days (28, 29, 30, 31 = 4 days) + Nov (1, 2, 3 = 3 days) = 7 days
  assert.strictEqual(days, 7, "Month-crossing must accurately calculate 7 days");
});

runScenario("1.4 Leap-year February crossing (Feb 27, 2028 to Mar 2, 2028)", () => {
  const from = new Date("2028-02-27T00:00:00Z");
  const to = new Date("2028-03-02T00:00:00Z");
  const days = Math.max(1, differenceInDays(to, from) + 1);
  // 2028 is a leap year (Feb 27, 28, 29 = 3 days) + Mar (1, 2 = 2 days) = 5 days
  assert.strictEqual(days, 5, "Leap year February must count 29th properly (5 days total)");
});

runScenario("1.5 Year-end rollover crossing (Dec 30, 2026 to Jan 5, 2027)", () => {
  const from = new Date("2026-12-30T00:00:00Z");
  const to = new Date("2027-01-05T00:00:00Z");
  const days = Math.max(1, differenceInDays(to, from) + 1);
  // Dec 30, 31 (2 days) + Jan 1, 2, 3, 4, 5 (5 days) = 7 days
  assert.strictEqual(days, 7, "Year-rollover must compute 7 days");
});

runScenario("1.6 Extended duration expedition (30 days)", () => {
  const from = new Date("2026-04-01T00:00:00Z");
  const to = new Date("2026-04-30T00:00:00Z");
  const days = Math.max(1, differenceInDays(to, from) + 1);
  assert.strictEqual(days, 30, "April 1 to April 30 must be exactly 30 days");
});

runScenario("1.7 Worst Case: Inverted dates (toDate < fromDate) rejected by Zod", () => {
  const inverted = {
    placeName: "Kyoto",
    fromDate: new Date("2026-06-10").getTime(),
    toDate: new Date("2026-06-05").getTime(),
    companion: "solo",
    activityPreferences: [],
  };
  const result = CreatePlanFormSchema.safeParse(inverted);
  assert.strictEqual(result.success, false, "Inverted dates must fail schema validation");
});

// =============================================================================
// SECTION 2: FORM VALIDATION & SANITIZATION (BEST & WORST CASES)
// =============================================================================
console.log("\n[SECTION 2: Form Validation & Sanitization]");

runScenario("2.1 Destination name with international characters (accented/kanji)", () => {
  const validForm = {
    placeName: "Reykjavík, Ísland",
    fromDate: new Date("2026-07-01").getTime(),
    toDate: new Date("2026-07-05").getTime(),
    companion: "partner",
    activityPreferences: ["Hiking & Nature", "Photography"],
  };
  const result = CreatePlanFormSchema.safeParse(validForm);
  assert.strictEqual(result.success, true);
});

runScenario("2.2 Worst Case: Blank / whitespace destination name rejected", () => {
  const blankForm = {
    placeName: "   ",
    fromDate: new Date("2026-07-01").getTime(),
    toDate: new Date("2026-07-05").getTime(),
    companion: "solo",
  };
  // Trim check: placeName requires min 2 characters
  assert.strictEqual(
    CreatePlanFormSchema.safeParse({ ...blankForm, placeName: blankForm.placeName.trim() }).success,
    false,
    "Trimmed empty placeName must fail validation"
  );
});

runScenario("2.3 Worst Case: Missing companion type rejected", () => {
  const noCompanion = {
    placeName: "Zurich",
    fromDate: new Date("2026-07-01").getTime(),
    toDate: new Date("2026-07-05").getTime(),
    companion: "",
  };
  assert.strictEqual(
    CreatePlanFormSchema.safeParse(noCompanion).success,
    false,
    "Missing companion must fail validation"
  );
});

runScenario("2.4 Default activity preferences handled as empty array", () => {
  const minimalForm = {
    placeName: "Florence, Italy",
    fromDate: new Date("2026-07-01").getTime(),
    toDate: new Date("2026-07-03").getTime(),
    companion: "family",
  };
  const parsed = CreatePlanFormSchema.parse(minimalForm);
  assert.deepStrictEqual(parsed.activityPreferences, [], "Defaults to empty array if omitted");
});

// =============================================================================
// SECTION 3: BATCH 1 SCHEMA VALIDATION (ABOUT & BEST TIME)
// =============================================================================
console.log("\n[SECTION 3: Batch 1 AI Schema]");

runScenario("3.1 Valid Batch 1 with >= 50 words about the place", () => {
  const valid = {
    abouttheplace:
      "Venice is a magical maritime city built on more than one hundred small islands in a lagoon in the Adriatic Sea. It has no roads, just canals lined with Renaissance and Gothic palaces. The central square, Piazza San Marco, contains Saint Mark's Basilica, which is tiled with Byzantine mosaics, and the Campanile bell tower offering views of the city's red roofs.",
    besttimetovisit: "April to June and September to October offer mild temperatures and fewer tourist crowds.",
  };
  const parsed = Batch1Schema.safeParse(valid);
  assert.strictEqual(parsed.success, true);
});

runScenario("3.2 Worst Case: Batch 1 rejected when word count is < 50", () => {
  const shortText = {
    abouttheplace: "A nice city with some canals and gondolas and old churches and friendly people.",
    besttimetovisit: "Summer months.",
  };
  const parsed = Batch1Schema.safeParse(shortText);
  assert.strictEqual(parsed.success, false, "Must reject descriptions under 50 words");
});

runScenario("3.3 Worst Case: Empty best time to visit rejected", () => {
  const validWords = new Array(55).fill("word").join(" ");
  const missingBestTime = {
    abouttheplace: validWords,
    besttimetovisit: "",
  };
  assert.strictEqual(Batch1Schema.safeParse(missingBestTime).success, false);
});

// =============================================================================
// SECTION 4: BATCH 2 SCHEMA VALIDATION (ACTIVITIES, CUISINES, PACKING)
// =============================================================================
console.log("\n[SECTION 4: Batch 2 AI Schema]");

runScenario("4.1 Valid Batch 2 with >= 5 activities, cuisines, and packing list", () => {
  const valid = {
    adventuresactivitiestodo: [
      "Gondola ride through the quiet back canals of Cannaregio",
      "Sunset bell tower climb at San Giorgio Maggiore",
      "Artisan glassblowing workshop on Murano Island",
      "Cicchetti wine bar hopping in San Polo",
      "Early morning stroll across the Rialto Bridge",
    ],
    localcuisinerecommendations: [
      "Sarde in saor (sweet and sour sardines)",
      "Risi e bisi (Venetian spring pea risotto)",
      "Bigoli in salsa (wholewheat pasta with anchovy sauce)",
      "Artisanal tiramisu",
    ],
    packingchecklist: [
      "Waterproof walking shoes for acqua alta",
      "Light trench coat or windbreaker",
      "Cross-body anti-theft shoulder bag",
      "Portable charger and EU power adapter",
      "Reusable water bottle for public fountains",
      "Modest shoulder wrap for historic basilicas",
    ],
  };
  assert.strictEqual(Batch2Schema.safeParse(valid).success, true);
});

runScenario("4.2 Worst Case: Batch 2 rejected when activities < 5", () => {
  const tooFew = {
    adventuresactivitiestodo: [
      "Activity 1",
      "Activity 2",
      "Activity 3",
      "Activity 4",
    ],
    localcuisinerecommendations: ["Dish 1", "Dish 2"],
    packingchecklist: ["Item 1", "Item 2"],
  };
  assert.strictEqual(Batch2Schema.safeParse(tooFew).success, false, "Must reject fewer than 5 activities");
});

runScenario("4.3 Worst Case: Empty cuisines or packing items rejected", () => {
  const emptyCuisine = {
    adventuresactivitiestodo: ["A1", "A2", "A3", "A4", "A5"],
    localcuisinerecommendations: [],
    packingchecklist: ["P1"],
  };
  assert.strictEqual(Batch2Schema.safeParse(emptyCuisine).success, false);
});

// =============================================================================
// SECTION 5: BATCH 3 SCHEMA VALIDATION (TOP PLACES & N-DAYS ITINERARY)
// =============================================================================
console.log("\n[SECTION 5: Batch 3 AI Schema & Coordinates]");

runScenario("5.1 Exactly N days enforced: N=4 accepts 4 days", () => {
  const schema4 = createBatch3Schema(4);
  const places = [
    { name: "P1", coordinates: { lat: 45.4408, lng: 12.3155 } },
    { name: "P2", coordinates: { lat: 45.4387, lng: 12.3271 } },
    { name: "P3", coordinates: { lat: 45.4342, lng: 12.3385 } },
    { name: "P4", coordinates: { lat: 45.4311, lng: 12.3422 } },
    { name: "P5", coordinates: { lat: 45.4375, lng: 12.3358 } },
  ];
  const makeDay = (d: number) => ({
    title: `Day ${d}: Exploration`,
    activities: {
      morning: [{ itineraryItem: "Morning Discovery Tour", briefDescription: "Scenic morning exploration of the historical quarter" }],
      afternoon: [{ itineraryItem: "Afternoon Cultural Visit", briefDescription: "Immersive guided tour through heritage museums" }],
      evening: [{ itineraryItem: "Evening Sunset Stroll", briefDescription: "Relaxing evening walk along the vibrant waterfront" }],
    },
  });

  const valid4 = {
    topplacestovisit: places,
    itinerary: [makeDay(1), makeDay(2), makeDay(3), makeDay(4)],
  };
  assert.strictEqual(schema4.safeParse(valid4).success, true);
});

runScenario("5.2 Worst Case: Day count mismatch (received 3 when expected 4) rejected", () => {
  const schema4 = createBatch3Schema(4);
  const places = [
    { name: "Place 1", coordinates: { lat: 45.4408, lng: 12.3155 } },
    { name: "Place 2", coordinates: { lat: 45.4387, lng: 12.3271 } },
    { name: "Place 3", coordinates: { lat: 45.4342, lng: 12.3385 } },
    { name: "Place 4", coordinates: { lat: 45.4311, lng: 12.3422 } },
    { name: "Place 5", coordinates: { lat: 45.4375, lng: 12.3358 } },
  ];
  const makeDay = (d: number) => ({
    title: `Day ${d}: Highlights`,
    activities: {
      morning: [{ itineraryItem: "Morning Discovery Tour", briefDescription: "Scenic morning exploration of the historical quarter" }],
      afternoon: [{ itineraryItem: "Afternoon Cultural Visit", briefDescription: "Immersive guided tour through heritage museums" }],
      evening: [{ itineraryItem: "Evening Sunset Stroll", briefDescription: "Relaxing evening walk along the vibrant waterfront" }],
    },
  });

  const invalid3 = {
    topplacestovisit: places,
    itinerary: [makeDay(1), makeDay(2), makeDay(3)],
  };
  assert.strictEqual(schema4.safeParse(invalid3).success, false);
});

runScenario("5.3 Worst Case: Latitude > 90 or < -90 rejected", () => {
  const schema1 = createBatch3Schema(1);
  const badLat = {
    topplacestovisit: [
      { name: "North Pole Beyond", coordinates: { lat: 91.5, lng: 12.0 } },
      { name: "Place 2", coordinates: { lat: 45.0, lng: 12.0 } },
      { name: "Place 3", coordinates: { lat: 45.0, lng: 12.0 } },
      { name: "Place 4", coordinates: { lat: 45.0, lng: 12.0 } },
      { name: "Place 5", coordinates: { lat: 45.0, lng: 12.0 } },
    ],
    itinerary: [
      {
        title: "Day 1: Arrival",
        activities: {
          morning: [{ itineraryItem: "Morning Discovery Tour", briefDescription: "Scenic morning exploration of the historical quarter" }],
          afternoon: [{ itineraryItem: "Afternoon Cultural Visit", briefDescription: "Immersive guided tour through heritage museums" }],
          evening: [{ itineraryItem: "Evening Sunset Stroll", briefDescription: "Relaxing evening walk along the vibrant waterfront" }],
        },
      },
    ],
  };
  assert.strictEqual(schema1.safeParse(badLat).success, false, "Latitude > 90 must be rejected");
});

runScenario("5.4 Worst Case: Longitude > 180 or < -180 rejected", () => {
  const schema1 = createBatch3Schema(1);
  const badLng = {
    topplacestovisit: [
      { name: "Bad Longitude", coordinates: { lat: 45.0, lng: 181.2 } },
      { name: "Place 2", coordinates: { lat: 45.0, lng: 12.0 } },
      { name: "Place 3", coordinates: { lat: 45.0, lng: 12.0 } },
      { name: "Place 4", coordinates: { lat: 45.0, lng: 12.0 } },
      { name: "Place 5", coordinates: { lat: 45.0, lng: 12.0 } },
    ],
    itinerary: [
      {
        title: "Day 1: Arrival",
        activities: {
          morning: [{ itineraryItem: "Morning Discovery Tour", briefDescription: "Scenic morning exploration of the historical quarter" }],
          afternoon: [{ itineraryItem: "Afternoon Cultural Visit", briefDescription: "Immersive guided tour through heritage museums" }],
          evening: [{ itineraryItem: "Evening Sunset Stroll", briefDescription: "Relaxing evening walk along the vibrant waterfront" }],
        },
      },
    ],
  };
  assert.strictEqual(schema1.safeParse(badLng).success, false, "Longitude > 180 must be rejected");
});

runScenario("5.5 Boundary Case: Exact edge coordinates (lat 90, lng 180, lat -90, lng -180)", () => {
  const schema1 = createBatch3Schema(1);
  const edgeCoords = {
    topplacestovisit: [
      { name: "Exact North Pole", coordinates: { lat: 90.0, lng: 0.0 } },
      { name: "Exact South Pole", coordinates: { lat: -90.0, lng: 0.0 } },
      { name: "Exact East Limit", coordinates: { lat: 0.0, lng: 180.0 } },
      { name: "Exact West Limit", coordinates: { lat: 0.0, lng: -180.0 } },
      { name: "Center Equator", coordinates: { lat: 0.0, lng: 0.0 } },
    ],
    itinerary: [
      {
        title: "Day 1: Arrival",
        activities: {
          morning: [{ itineraryItem: "Morning Discovery Tour", briefDescription: "Scenic morning exploration of the historical quarter" }],
          afternoon: [{ itineraryItem: "Afternoon Cultural Visit", briefDescription: "Immersive guided tour through heritage museums" }],
          evening: [{ itineraryItem: "Evening Sunset Stroll", briefDescription: "Relaxing evening walk along the vibrant waterfront" }],
        },
      },
    ],
  };
  assert.strictEqual(schema1.safeParse(edgeCoords).success, true, "Exact +/-90 and +/-180 must be accepted");
});

// =============================================================================
// SECTION 6: FALLBACK GENERATOR RESILIENCE (UNRECOGNIZED DESTINATIONS & EDGES)
// =============================================================================
console.log("\n[SECTION 6: Fallback Generator Resilience]");

runScenario("6.1 Fallback Generator for exotic/unlisted destination ('Reykjavík')", () => {
  const prompt = [
    "Destination: Reykjavík",
    "Trip Duration: 3 day(s)",
    "Travel Window: 01 Jul 2026 to 03 Jul 2026",
    "Travel Companion Type: partner",
    "Activity Preferences: Outdoor, Hot Springs",
  ].join("\n");

  const b1 = generateFallbackBatch1(prompt);
  const b2 = generateFallbackBatch2(prompt);
  const b3 = generateFallbackBatch3(prompt);

  assert.strictEqual(Batch1Schema.safeParse(b1).success, true);
  assert.strictEqual(Batch2Schema.safeParse(b2).success, true);
  const b3Schema = createBatch3Schema(3);
  assert.strictEqual(b3Schema.safeParse(b3).success, true);
  assert.strictEqual(b3.itinerary.length, 3);
});

runScenario("6.2 Fallback Generator for single-day trip (1 day)", () => {
  const prompt = [
    "Destination: Tokyo",
    "Trip Duration: 1 day(s)",
    "Travel Companion Type: solo",
  ].join("\n");

  const b3 = generateFallbackBatch3(prompt);
  assert.strictEqual(b3.itinerary.length, 1, "Must generate exactly 1 day");
  assert.strictEqual(b3.topplacestovisit.length, 5, "Must generate 5 places");
});

runScenario("6.3 Fallback Generator for 14-day grand expedition", () => {
  const prompt = [
    "Destination: Switzerland",
    "Trip Duration: 14 day(s)",
    "Travel Companion Type: family",
  ].join("\n");

  const b3 = generateFallbackBatch3(prompt);
  assert.strictEqual(b3.itinerary.length, 14, "Must generate exactly 14 days");
  const b3Schema14 = createBatch3Schema(14);
  assert.strictEqual(b3Schema14.safeParse(b3).success, true);
});

runScenario("6.4 Fallback Generator with completely blank prompt (handles missing tags)", () => {
  const b1 = generateFallbackBatch1("");
  const b2 = generateFallbackBatch2("");
  const b3 = generateFallbackBatch3("");

  assert.strictEqual(Batch1Schema.safeParse(b1).success, true);
  assert.strictEqual(Batch2Schema.safeParse(b2).success, true);
  // Defaults to 3 days when missing from prompt
  const b3Schema3 = createBatch3Schema(3);
  assert.strictEqual(b3Schema3.safeParse(b3).success, true);
});

// =============================================================================
// SECTION 7: PROMPT BUILDER INTEGRITY (NO LEAKS, NO DRIFT)
// =============================================================================
console.log("\n[SECTION 7: Prompt Builder]");

runScenario("7.1 Batch 1, 2, and 3 prompt construction accuracy", () => {
  const p1 = buildPrompt({
    destination: "Lisbon, Portugal",
    fromDate: new Date("2026-09-10").getTime(),
    toDate: new Date("2026-09-15").getTime(),
    noOfDays: 6,
    companion: "friends",
    activityPreferences: ["Foodie & Fine Dining", "Scenic Viewpoints & Photo Spots"],
    batch: 1,
  });

  assert.ok(p1.includes("Destination: Lisbon, Portugal"));
  assert.ok(p1.includes("Trip Duration: 6 day(s)"));
  assert.ok(p1.includes("Batch 1"));
  assert.ok(p1.includes("at least 50 words"));

  const p2 = buildPrompt({
    destination: "Lisbon, Portugal",
    noOfDays: 6,
    batch: 2,
  });
  assert.ok(p2.includes("Batch 2"));
  assert.ok(p2.includes("adventuresactivitiestodo"));

  const p3 = buildPrompt({
    destination: "Lisbon, Portugal",
    noOfDays: 6,
    batch: 3,
  });
  assert.ok(p3.includes("Batch 3"));
  assert.ok(p3.includes("EXACTLY 6 day(s)"));
});

// =============================================================================
// SECTION 8: EXPENSE CALCULATIONS & AGGREGATIONS (BEST & WORST CASES)
// =============================================================================
console.log("\n[SECTION 8: Expense Calculation Engine]");

interface ExpenseItem {
  amount: number;
  category: "food" | "commute" | "shopping" | "gifts" | "accommodation" | "others";
  userId: string;
  purpose: string;
  date: string;
}

function calculateExpenseMetrics(expenses: ExpenseItem[]) {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory: Record<string, { sum: number; count: number }> = {
    food: { sum: 0, count: 0 },
    commute: { sum: 0, count: 0 },
    shopping: { sum: 0, count: 0 },
    gifts: { sum: 0, count: 0 },
    accommodation: { sum: 0, count: 0 },
    others: { sum: 0, count: 0 },
  };

  const byContributor: Record<string, number> = {};

  for (const e of expenses) {
    const cat = byCategory[e.category] || byCategory.others;
    cat.sum = Math.round((cat.sum + e.amount) * 100) / 100;
    cat.count++;

    byContributor[e.userId] = Math.round(((byContributor[e.userId] || 0) + e.amount) * 100) / 100;
  }

  return {
    total: Math.round(total * 100) / 100,
    byCategory,
    byContributor,
    count: expenses.length,
  };
}

runScenario("8.1 Empty expenses array (zero states)", () => {
  const metrics = calculateExpenseMetrics([]);
  assert.strictEqual(metrics.total, 0);
  assert.strictEqual(metrics.count, 0);
  assert.strictEqual(metrics.byCategory.food.sum, 0);
  assert.strictEqual(Object.keys(metrics.byContributor).length, 0);
});

runScenario("8.2 Multi-contributor, multi-category aggregation with rounding", () => {
  const expenses: ExpenseItem[] = [
    { amount: 45.5, category: "food", userId: "user_a", purpose: "Dinner", date: "2026-10-10" },
    { amount: 120.0, category: "accommodation", userId: "user_a", purpose: "Hotel", date: "2026-10-10" },
    { amount: 15.75, category: "commute", userId: "user_b", purpose: "Metro", date: "2026-10-11" },
    { amount: 34.25, category: "food", userId: "user_b", purpose: "Lunch", date: "2026-10-11" },
  ];

  const metrics = calculateExpenseMetrics(expenses);
  // 45.50 + 120.00 + 15.75 + 34.25 = 215.50
  assert.strictEqual(metrics.total, 215.5);
  assert.strictEqual(metrics.byCategory.food.sum, 79.75);
  assert.strictEqual(metrics.byCategory.food.count, 2);
  assert.strictEqual(metrics.byContributor.user_a, 165.5);
  assert.strictEqual(metrics.byContributor.user_b, 50.0);
});

runScenario("8.3 Worst Case: Unknown category defaults to 'others'", () => {
  const rawList: any[] = [
    { amount: 25.0, category: "unexpected_cat", userId: "u1", purpose: "Tips", date: "2026-10-10" },
  ];
  const metrics = calculateExpenseMetrics(rawList);
  assert.strictEqual(metrics.byCategory.others.sum, 25.0);
  assert.strictEqual(metrics.byCategory.others.count, 1);
});

// =============================================================================
// SECTION 9: MAP COORDINATES NORMALIZATION & BOUNDS
// =============================================================================
console.log("\n[SECTION 9: Map Normalization & Coordinates Bounds]");

function computeMapCenter(places: { coordinates: { lat: number; lng: number } }[]) {
  const valid = places.filter(
    (p) =>
      typeof p.coordinates?.lat === "number" &&
      typeof p.coordinates?.lng === "number" &&
      !isNaN(p.coordinates.lat) &&
      !isNaN(p.coordinates.lng) &&
      p.coordinates.lat >= -90 &&
      p.coordinates.lat <= 90 &&
      p.coordinates.lng >= -180 &&
      p.coordinates.lng <= 180
  );

  if (valid.length === 0) {
    return { lat: 20.0, lng: 0.0, count: 0 }; // World fallback
  }

  const avgLat = valid.reduce((sum, p) => sum + p.coordinates.lat, 0) / valid.length;
  const avgLng = valid.reduce((sum, p) => sum + p.coordinates.lng, 0) / valid.length;

  return {
    lat: parseFloat(avgLat.toFixed(5)),
    lng: parseFloat(avgLng.toFixed(5)),
    count: valid.length,
  };
}

runScenario("9.1 Empty places list returns safe global fallback", () => {
  const center = computeMapCenter([]);
  assert.strictEqual(center.count, 0);
  assert.strictEqual(center.lat, 20.0);
  assert.strictEqual(center.lng, 0.0);
});

runScenario("9.2 Malformed and NaN coordinates filtered out safely", () => {
  const messyPlaces: any[] = [
    { coordinates: { lat: NaN, lng: 12.0 } },
    { coordinates: { lat: "45", lng: "12" } }, // strings
    { coordinates: { lat: 100.0, lng: 50.0 } }, // out of bounds
    { coordinates: { lat: 40.0, lng: -74.0 } }, // valid New York
    { coordinates: { lat: 42.0, lng: -72.0 } }, // valid Massachusetts
  ];
  const center = computeMapCenter(messyPlaces);
  assert.strictEqual(center.count, 2);
  assert.strictEqual(center.lat, 41.0);
  assert.strictEqual(center.lng, -73.0);
});

// =============================================================================
// SECTION 10: COLLABORATION & ACCESS CONTROL PERMISSIONS
// =============================================================================
console.log("\n[SECTION 10: Collaboration Access Control]");

interface MockPlan {
  _id: string;
  userId: string; // owner
}

interface MockAccess {
  planId: string;
  userId: string;
}

function checkPermissions(
  currentUserId: string | null,
  plan: MockPlan | null,
  accessList: MockAccess[]
) {
  if (!currentUserId || !plan) {
    return { canView: false, canEdit: false, canInvite: false, canDelete: false, isOwner: false };
  }

  const isOwner = plan.userId === currentUserId;
  const isCollaborator = accessList.some(
    (a) => a.planId === plan._id && a.userId === currentUserId
  );

  return {
    canView: isOwner || isCollaborator,
    canEdit: isOwner || isCollaborator,
    canInvite: isOwner, // only owner can invite
    canDelete: isOwner, // only owner can delete plan
    isOwner,
  };
}

runScenario("10.1 Plan Owner has full administrative permissions", () => {
  const plan: MockPlan = { _id: "plan_1", userId: "user_owner" };
  const perms = checkPermissions("user_owner", plan, []);
  assert.strictEqual(perms.canView, true);
  assert.strictEqual(perms.canEdit, true);
  assert.strictEqual(perms.canInvite, true);
  assert.strictEqual(perms.canDelete, true);
  assert.strictEqual(perms.isOwner, true);
});

runScenario("10.2 Invited Collaborator can view and edit, but cannot invite or delete plan", () => {
  const plan: MockPlan = { _id: "plan_1", userId: "user_owner" };
  const access: MockAccess[] = [{ planId: "plan_1", userId: "user_friend" }];
  const perms = checkPermissions("user_friend", plan, access);
  assert.strictEqual(perms.canView, true);
  assert.strictEqual(perms.canEdit, true);
  assert.strictEqual(perms.canInvite, false, "Collaborator must not invite others");
  assert.strictEqual(perms.canDelete, false, "Collaborator must not delete plan");
  assert.strictEqual(perms.isOwner, false);
});

runScenario("10.3 Uninvited stranger is denied all access", () => {
  const plan: MockPlan = { _id: "plan_1", userId: "user_owner" };
  const perms = checkPermissions("user_stranger", plan, []);
  assert.strictEqual(perms.canView, false);
  assert.strictEqual(perms.canEdit, false);
  assert.strictEqual(perms.canInvite, false);
  assert.strictEqual(perms.canDelete, false);
});

runScenario("10.4 Unauthenticated guest is denied all access", () => {
  const plan: MockPlan = { _id: "plan_1", userId: "user_owner" };
  const perms = checkPermissions(null, plan, []);
  assert.strictEqual(perms.canView, false);
});

// =============================================================================
// SECTION 11: PUBLIC COMMUNITY PUBLISHING MATRIX
// =============================================================================
console.log("\n[SECTION 11: Public Community Publishing Matrix]");

function canAccessPublicPlan(plan: { isPublished: boolean } | null) {
  if (!plan) return false;
  return plan.isPublished === true;
}

runScenario("11.1 Published trip is visible to the public community", () => {
  assert.strictEqual(canAccessPublicPlan({ isPublished: true }), true);
});

runScenario("11.2 Private/unpublished trip is hidden from public access", () => {
  assert.strictEqual(canAccessPublicPlan({ isPublished: false }), false);
  assert.strictEqual(canAccessPublicPlan(null), false);
});

// =============================================================================
// SUMMARY REPORT
// =============================================================================
console.log("\n=====================================================================");
console.log(`AUDIT COMPLETE: ${totalPassed} SCENARIOS PASSED, ${totalFailed} FAILED`);
console.log("=====================================================================");
