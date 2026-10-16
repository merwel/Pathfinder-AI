import assert from "node:assert/strict";
import { buildPrompt } from "./buildPrompt";

function runTests() {
  console.log("Running buildPrompt unit tests...");

  const baseParams = {
    destination: "Kyoto, Japan",
    fromDate: 1773302400000, // 12 Mar 2026
    toDate: 1773561600000, // 15 Mar 2026
    noOfDays: 4,
    companion: "partner",
    activityPreferences: ["Historic Landmarks & Culture", "Foodie & Fine Dining"],
  };

  // Test 1: Batch 1 Prompt
  const promptBatch1 = buildPrompt({ ...baseParams, batch: 1 });
  assert.ok(promptBatch1.includes("Kyoto, Japan"), "Should include destination");
  assert.ok(promptBatch1.includes("12 Mar 2026"), "Should format fromDate with date-fns");
  assert.ok(promptBatch1.includes("15 Mar 2026"), "Should format toDate with date-fns");
  assert.ok(!promptBatch1.includes("1773302400000"), "Must NOT include raw epoch numbers");
  assert.ok(promptBatch1.includes("at least 50 words"), "Must specify at least 50 words for about");
  assert.ok(promptBatch1.includes("abouttheplace"), "Must request abouttheplace field");
  assert.ok(promptBatch1.includes("besttimetovisit"), "Must request besttimetovisit field");

  // Test 2: Batch 2 Prompt
  const promptBatch2 = buildPrompt({ ...baseParams, batch: 2 });
  assert.ok(promptBatch2.includes("adventuresactivitiestodo"), "Must request adventuresactivitiestodo");
  assert.ok(promptBatch2.includes("at least 5 distinct"), "Must specify at least 5 activities");
  assert.ok(promptBatch2.includes("venue location"), "Must specify location requirement");
  assert.ok(promptBatch2.includes("localcuisinerecommendations"), "Must request localcuisinerecommendations");
  assert.ok(promptBatch2.includes("packingchecklist"), "Must request packingchecklist");
  assert.ok(promptBatch2.includes("partner"), "Must include companion type");

  // Test 3: Batch 3 Prompt
  const promptBatch3 = buildPrompt({ ...baseParams, batch: 3 });
  assert.ok(promptBatch3.includes("EXACTLY 4 day(s)"), "Must require exactly N days for itinerary");
  assert.ok(promptBatch3.includes("topplacestovisit"), "Must request topplacestovisit");
  assert.ok(promptBatch3.includes("coordinates"), "Must request geographic coordinates");
  assert.ok(promptBatch3.includes("morning"), "Must request morning activities");
  assert.ok(promptBatch3.includes("afternoon"), "Must request afternoon activities");
  assert.ok(promptBatch3.includes("evening"), "Must request evening activities");

  // Test 4: Pure function guarantees (no mutation / internal state leak)
  const callA = buildPrompt({ ...baseParams, batch: 1 });
  const callB = buildPrompt({ ...baseParams, batch: 1 });
  assert.equal(callA, callB, "Consecutive calls with identical arguments must produce identical output");

  console.log("All buildPrompt unit tests passed successfully!");
}

runTests();
