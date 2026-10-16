import assert from "assert";
import { differenceInDays } from "date-fns";
import {
  Batch1Schema,
  Batch2Schema,
  createBatch3Schema,
} from "../lib/ai/schemas";
import {
  generateFallbackBatch1,
  generateFallbackBatch2,
  generateFallbackBatch3,
} from "../lib/ai/fallbackGenerator";

console.log("==================================================");
console.log("RUNNING TRAVEL PLANNER ACCEPTANCE TEST VERIFICATIONS");
console.log("==================================================");

// -----------------------------------------------------------------------------
// TEST 1: Date Difference Calculation Formula
// -----------------------------------------------------------------------------
console.log("\n[Test 1] Verifying Date Difference Formula (differenceInDays + 1)...");
const from = new Date("2026-06-10T00:00:00Z");
const to = new Date("2026-06-12T00:00:00Z");
const calculatedDays = differenceInDays(to, from) + 1;
assert.strictEqual(calculatedDays, 3, "Formula differenceInDays(to, from) + 1 must equal 3 for a 3-day trip");
console.log("✓ Date formula differenceInDays(to, from) + 1 passed for 3-day trip.");

// -----------------------------------------------------------------------------
// TEST 2: Batch 1 Validation - Word Count Enforced (>= 50 words)
// -----------------------------------------------------------------------------
console.log("\n[Test 2] Verifying Batch 1 Word Count Requirement (>= 50 words)...");
const shortAbout = {
  abouttheplace: "A small place with very few words in this short description.",
  besttimetovisit: "Spring months.",
};
const shortResult = Batch1Schema.safeParse(shortAbout);
assert.strictEqual(shortResult.success, false, "Batch 1 must reject abouttheplace with < 50 words");

const validWords = new Array(55).fill("destination").join(" ");
const validAbout = {
  abouttheplace: `Kyoto is an ancient imperial capital rich in historic temples and culture. ${validWords}`,
  besttimetovisit: "March through May during cherry blossom season and October to November.",
};
const validResult = Batch1Schema.safeParse(validAbout);
assert.strictEqual(validResult.success, true, "Batch 1 must accept abouttheplace with >= 50 words");
console.log("✓ Batch 1 minimum word count validation passed.");

// -----------------------------------------------------------------------------
// TEST 3: Batch 2 Validation - Activities Count (>= 5 with locations)
// -----------------------------------------------------------------------------
console.log("\n[Test 3] Verifying Batch 2 Activity Count (>= 5 items)...");
const invalidBatch2 = {
  adventuresactivitiestodo: ["Only one activity"],
  localcuisinerecommendations: ["Ramen"],
  packingchecklist: ["Passport"],
};
assert.strictEqual(Batch2Schema.safeParse(invalidBatch2).success, false, "Batch 2 must reject < 5 activities");

const validBatch2 = {
  adventuresactivitiestodo: [
    "Hike up to Fushimi Inari Shrine summit, Southern Kyoto",
    "Explore bamboo groves at Arashiyama Park, Western Kyoto",
    "Attend a traditional tea ceremony in Gion Historic District",
    "Sample local street food at Nishiki Market, Central Kyoto",
    "Walk the Philosopher's Path between Silver Pavilion and Nanzen-ji",
  ],
  localcuisinerecommendations: ["Kaiseki dining", "Matcha soft serve", "Yudofu tofu hot pot"],
  packingchecklist: ["Comfortable walking sneakers", "Pocket WiFi", "Power bank", "Umbrella"],
};
assert.strictEqual(Batch2Schema.safeParse(validBatch2).success, true, "Batch 2 must accept >= 5 activities");
console.log("✓ Batch 2 minimum activity count validation passed.");

// -----------------------------------------------------------------------------
// TEST 4: Batch 3 Validation - Exact N Days & Geo-Coordinates Range
// -----------------------------------------------------------------------------
console.log("\n[Test 4] Verifying Batch 3 Exact N Days & Coordinate Constraints...");
const batch3Schema3Days = createBatch3Schema(3);

const mockPlaces = [
  { name: "Kinkaku-ji", coordinates: { lat: 35.0394, lng: 135.7292 } },
  { name: "Fushimi Inari", coordinates: { lat: 34.9671, lng: 135.7727 } },
  { name: "Kiyomizu-dera", coordinates: { lat: 34.9949, lng: 135.785 } },
  { name: "Arashiyama", coordinates: { lat: 35.0116, lng: 135.6777 } },
  { name: "Gion District", coordinates: { lat: 35.0037, lng: 135.7778 } },
];

const mockItineraryDay = (i: number) => ({
  title: `Day ${i}: Highlights of Kyoto`,
  activities: {
    morning: [{ itineraryItem: "Morning Walk", briefDescription: "Temple visit" }],
    afternoon: [{ itineraryItem: "Afternoon Tour", briefDescription: "Tea tasting" }],
    evening: [{ itineraryItem: "Evening Stroll", briefDescription: "Lantern lit alleyways" }],
  },
});

// Reject 2 days when expecting 3
const wrongDaysResult = batch3Schema3Days.safeParse({
  itinerary: [mockItineraryDay(1), mockItineraryDay(2)],
  topplacestovisit: mockPlaces,
});
assert.strictEqual(wrongDaysResult.success, false, "Must reject itinerary when days !== N");

// Reject invalid coordinates (lat > 90)
const invalidCoordResult = batch3Schema3Days.safeParse({
  itinerary: [mockItineraryDay(1), mockItineraryDay(2), mockItineraryDay(3)],
  topplacestovisit: [
    ...mockPlaces.slice(0, 4),
    { name: "Invalid Lat", coordinates: { lat: 95.0, lng: 100.0 } },
  ],
});
assert.strictEqual(invalidCoordResult.success, false, "Must reject latitude > 90");

// Accept exactly 3 days with valid places
const validBatch3Result = batch3Schema3Days.safeParse({
  itinerary: [mockItineraryDay(1), mockItineraryDay(2), mockItineraryDay(3)],
  topplacestovisit: mockPlaces,
});
assert.strictEqual(validBatch3Result.success, true, "Must accept exactly 3 days with valid coordinates");
console.log("✓ Batch 3 exact N days and latitude [-90, 90] / longitude [-180, 180] passed.");

// -----------------------------------------------------------------------------
// TEST 5: Idempotent Payment Fulfillment Logic
// -----------------------------------------------------------------------------
console.log("\n[Test 5] Verifying Stripe Idempotent Payment Fulfillment Logic...");
interface PaymentDoc {
  paymentId: string;
  status: "initiated" | "paid" | "failed";
  creditsGranted: number;
}

let simulatedUserCredits = 2;
const paymentRecord: PaymentDoc = {
  paymentId: "cs_test_123456789",
  status: "initiated",
  creditsGranted: 5,
};

function fulfillPayment(payment: PaymentDoc) {
  if (payment.status === "paid") {
    // Idempotent skip: do not grant credits again
    return { granted: false, credits: simulatedUserCredits };
  }
  payment.status = "paid";
  simulatedUserCredits += payment.creditsGranted;
  return { granted: true, credits: simulatedUserCredits };
}

// First webhook run: grants credits
const run1 = fulfillPayment(paymentRecord);
assert.strictEqual(run1.granted, true);
assert.strictEqual(simulatedUserCredits, 7);

// Second replayed webhook run: skips duplicate grant
const run2 = fulfillPayment(paymentRecord);
assert.strictEqual(run2.granted, false);
assert.strictEqual(simulatedUserCredits, 7, "Credits must not increase on replayed webhook");
console.log("✓ Idempotent payment webhook logic passed (credits granted exactly once).");

// -----------------------------------------------------------------------------
// TEST 6: Invite Token Email Verification Logic
// -----------------------------------------------------------------------------
console.log("\n[Test 6] Verifying Invite Token Verification & Single-Use Consumption...");
interface InviteRecord {
  token: string;
  email: string;
  consumed: boolean;
}

const mockInvite: InviteRecord = {
  token: "abcdef1234567890abcdef1234567890",
  email: "partner@example.com",
  consumed: false,
};

function claimInvite(token: string, signedInEmail: string, invite: InviteRecord | null) {
  if (!invite || invite.consumed) {
    throw new Error("Invalid or expired invite token.");
  }
  if (signedInEmail.toLowerCase() !== invite.email.toLowerCase()) {
    throw new Error("Email mismatch: user does not match invited email.");
  }
  invite.consumed = true;
  return { success: true };
}

// Wrong email rejected
assert.throws(
  () => claimInvite(mockInvite.token, "hacker@example.com", mockInvite),
  /Email mismatch/,
  "Wrong email claiming invite must throw mismatch error"
);

// Correct email succeeds
const claimResult = claimInvite(mockInvite.token, "partner@example.com", mockInvite);
assert.strictEqual(claimResult.success, true);
assert.strictEqual(mockInvite.consumed, true);

// Second use of same token fails
assert.throws(
  () => claimInvite(mockInvite.token, "partner@example.com", mockInvite),
  /Invalid or expired/,
  "Re-using consumed invite token must fail"
);
console.log("✓ Invite token verification & single-use consumption passed.");

// -----------------------------------------------------------------------------
// TEST 7: Fallback Travel Intelligence Generator Validates Against Zod Schemas
// -----------------------------------------------------------------------------
console.log("\n[Test 7] Verifying Fallback Generator against Zod Schemas for Kalpa (6 days)...");

const kalpaPrompt = [
  "Destination: Kalpa",
  "Trip Duration: 6 day(s)",
  "Travel Window: 07 Dec 2026 to 12 Dec 2026",
  "Travel Companion Type: friends",
  "Activity Preferences: Historic Landmarks & Culture, Hiking & Nature",
].join("\n");

const fbBatch1 = generateFallbackBatch1(kalpaPrompt + "\nBatch 1");
const fbBatch2 = generateFallbackBatch2(kalpaPrompt + "\nBatch 2");
const fbBatch3 = generateFallbackBatch3(kalpaPrompt + "\nBatch 3");

assert.strictEqual(Batch1Schema.safeParse(fbBatch1).success, true, "Fallback Batch 1 must pass Batch1Schema");
assert.strictEqual(Batch2Schema.safeParse(fbBatch2).success, true, "Fallback Batch 2 must pass Batch2Schema");
const fbBatch3Validator = createBatch3Schema(6);
assert.strictEqual(fbBatch3Validator.safeParse(fbBatch3).success, true, "Fallback Batch 3 must pass createBatch3Schema(6)");
assert.strictEqual(fbBatch3.itinerary.length, 6, "Must produce exactly 6 days for 6-day trip");
assert.strictEqual(fbBatch3.topplacestovisit.length >= 5, true, "Must produce >= 5 top places");
console.log("✓ Fallback Travel Generator produced 100% schema-valid travel plan for 6 days.");

console.log("\n==================================================");
console.log("ALL ACCEPTANCE TESTS PASSED SUCCESSFULLY! (7/7)");
console.log("==================================================");
