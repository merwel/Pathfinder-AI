import { v, ConvexError } from "convex/values";
import { mutation, query, internalQuery, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireIdentity, requirePlanOwner, requirePlanAccess, checkPlanAccess } from "./lib/access";
import { rateLimiter } from "./rateLimiter";
import { buildPrompt } from "../lib/ai/buildPrompt";
import {
  Batch1Schema,
  Batch2Schema,
  createBatch3Schema,
  getBatch1JsonSchema,
  getBatch2JsonSchema,
  getBatch3JsonSchema,
} from "../lib/ai/schemas";
import { generateStructured } from "../lib/ai/provider";

// =============================================================================
// PLAN CREATION & ORCHESTRATION
// =============================================================================

export const createPlan = mutation({
  args: {
    placeName: v.string(),
    noOfDays: v.number(),
    activityPreferences: v.optional(v.array(v.string())),
    fromDate: v.optional(v.number()),
    toDate: v.optional(v.number()),
    companion: v.optional(v.string()),
    isGeneratedUsingAI: v.boolean(),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate
    const identity = await requireIdentity(ctx);

    // Ensure user record exists
    let user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!user) {
      const email = identity.email || "";
      const userId = await ctx.db.insert("users", {
        userId: identity.subject,
        email,
        firstName: (identity.givenName as string) || undefined,
        lastName: (identity.familyName as string) || undefined,
        credits: 0,
        freeCredits: 2,
      });
      user = await ctx.db.get(userId);
    }

    if (!user) {
      throw new ConvexError("Failed to initialize user record.");
    }

    // 2. Unlimited AI Trips Mode (Credits removed)
    // All authenticated users can generate unlimited AI travel plans with no credit deduction.

    // 3. Insert Plan
    const isAi = args.isGeneratedUsingAI;
    const initialFlags = isAi
      ? {
          imagination: false,
          abouttheplace: false,
          adventuresactivitiestodo: false,
          topplacestovisit: false,
          itinerary: false,
          localcuisinerecommendations: false,
          packingchecklist: false,
          besttimetovisit: false,
        }
      : {
          imagination: false, // will become true when image resolves
          abouttheplace: true,
          adventuresactivitiestodo: true,
          topplacestovisit: true,
          itinerary: true,
          localcuisinerecommendations: true,
          packingchecklist: true,
          besttimetovisit: true,
        };

    const planId = await ctx.db.insert("plan", {
      userId: identity.subject,
      nameoftheplace: args.placeName,
      userPrompt: `${args.placeName} for ${args.noOfDays} day(s) with ${args.companion || "companion"}`,
      isGeneratedUsingAI: isAi,
      storageId: null,
      abouttheplace: isAi ? "" : "Welcome to your custom travel itinerary. Click any section to begin adding your personal recommendations, notes, and highlights.",
      besttimetovisit: isAi ? "" : "Recommended all year round depending on your seasonal preferences.",
      adventuresactivitiestodo: [],
      localcuisinerecommendations: [],
      packingchecklist: [],
      topplacestovisit: [],
      itinerary: isAi
        ? []
        : Array.from({ length: args.noOfDays }, (_, i) => ({
            title: `Day ${i + 1}: Exploration`,
            activities: {
              morning: [{ itineraryItem: "Morning Discovery", briefDescription: "Start your day exploring local highlights." }],
              afternoon: [{ itineraryItem: "Afternoon Adventure", briefDescription: "Visit cultural spots and enjoy lunch." }],
              evening: [{ itineraryItem: "Evening Stroll & Dinner", briefDescription: "Relax at scenic viewpoints or local dining." }],
            },
          })),
      contentGenerationState: initialFlags,
    });

    // 4. Insert Settings
    await ctx.db.insert("planSettings", {
      planId,
      userId: identity.subject,
      currencyCode: "USD",
      activityPreferences: args.activityPreferences || [],
      fromDate: args.fromDate,
      toDate: args.toDate,
      companion: args.companion,
      isPublished: false,
    });

    return planId;
  },
});

/**
 * Schedules all 4 generation background jobs with retries.
 */
export const scheduleGenerationJobs = mutation({
  args: {
    planId: v.id("plan"),
  },
  handler: async (ctx, args) => {
    // Schedule Unsplash cover photo search
    await ctx.scheduler.runAfter(0, internal.retrier.runWithRetry, {
      actionName: "images.generateAndStore",
      payload: { planId: args.planId },
      attempt: 1,
    });

    // Schedule Batch 1: About & Best time
    await ctx.scheduler.runAfter(0, internal.retrier.runWithRetry, {
      actionName: "plan.prepareBatch1",
      payload: { planId: args.planId },
      attempt: 1,
    });

    // Schedule Batch 2: Activities, Cuisines, Packing list
    await ctx.scheduler.runAfter(0, internal.retrier.runWithRetry, {
      actionName: "plan.prepareBatch2",
      payload: { planId: args.planId },
      attempt: 1,
    });

    // Schedule Batch 3: Itinerary & Top Places with Coordinates
    await ctx.scheduler.runAfter(0, internal.retrier.runWithRetry, {
      actionName: "plan.prepareBatch3",
      payload: { planId: args.planId },
      attempt: 1,
    });
  },
});

/**
 * Schedules only the image job for empty plans.
 */
export const scheduleImageJobOnly = mutation({
  args: {
    planId: v.id("plan"),
  },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, internal.retrier.runWithRetry, {
      actionName: "images.generateAndStore",
      payload: { planId: args.planId },
      attempt: 1,
    });
  },
});

// =============================================================================
// INTERNAL QUERIES & BACKGROUND ACTIONS
// =============================================================================

export const getPlanInternal = internalQuery({
  args: {
    planId: v.id("plan"),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return null;

    const settings = await ctx.db
      .query("planSettings")
      .withIndex("by_planId", (q) => q.eq("planId", args.planId))
      .unique();

    return { plan, settings };
  },
});

/**
 * Batch 1 Action: About the place (>= 50 words) & Best time to visit.
 */
export const prepareBatch1 = internalAction({
  args: {
    planId: v.id("plan"),
  },
  handler: async (ctx, args) => {
    const data = await ctx.runQuery(internal.plan.getPlanInternal, {
      planId: args.planId,
    });
    if (!data) throw new Error(`Plan ${args.planId} not found`);

    const { plan, settings } = data;
    const noOfDays =
      settings?.fromDate && settings?.toDate
        ? Math.max(1, Math.round((settings.toDate - settings.fromDate) / (1000 * 60 * 60 * 24)) + 1)
        : 3;

    const prompt = buildPrompt({
      destination: plan.nameoftheplace,
      fromDate: settings?.fromDate,
      toDate: settings?.toDate,
      noOfDays,
      companion: settings?.companion,
      activityPreferences: settings?.activityPreferences,
      batch: 1,
    });

    const schema = getBatch1JsonSchema();
    const rawResult = await generateStructured(prompt, schema);

    // Validate strictly with Zod - throws on validation failure to trigger exponential backoff retry
    const validated = Batch1Schema.parse(rawResult);

    // Overwrite only Batch 1 fields
    await ctx.runMutation(internal.plan.patchBatch1, {
      planId: args.planId,
      abouttheplace: validated.abouttheplace,
      besttimetovisit: validated.besttimetovisit,
    });
  },
});

export const patchBatch1 = internalMutation({
  args: {
    planId: v.id("plan"),
    abouttheplace: v.string(),
    besttimetovisit: v.string(),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return;

    await ctx.db.patch(args.planId, {
      abouttheplace: args.abouttheplace,
      besttimetovisit: args.besttimetovisit,
      contentGenerationState: {
        ...plan.contentGenerationState,
        abouttheplace: true,
        besttimetovisit: true,
      },
    });
  },
});

/**
 * Batch 2 Action: Adventures & activities (>= 5 with location), Cuisines, Packing list.
 */
export const prepareBatch2 = internalAction({
  args: {
    planId: v.id("plan"),
  },
  handler: async (ctx, args) => {
    const data = await ctx.runQuery(internal.plan.getPlanInternal, {
      planId: args.planId,
    });
    if (!data) throw new Error(`Plan ${args.planId} not found`);

    const { plan, settings } = data;
    const noOfDays =
      settings?.fromDate && settings?.toDate
        ? Math.max(1, Math.round((settings.toDate - settings.fromDate) / (1000 * 60 * 60 * 24)) + 1)
        : 3;

    const prompt = buildPrompt({
      destination: plan.nameoftheplace,
      fromDate: settings?.fromDate,
      toDate: settings?.toDate,
      noOfDays,
      companion: settings?.companion,
      activityPreferences: settings?.activityPreferences,
      batch: 2,
    });

    const schema = getBatch2JsonSchema();
    const rawResult = await generateStructured(prompt, schema);

    // Validate with Zod
    const validated = Batch2Schema.parse(rawResult);

    await ctx.runMutation(internal.plan.patchBatch2, {
      planId: args.planId,
      adventuresactivitiestodo: validated.adventuresactivitiestodo,
      localcuisinerecommendations: validated.localcuisinerecommendations,
      packingchecklist: validated.packingchecklist,
    });
  },
});

export const patchBatch2 = internalMutation({
  args: {
    planId: v.id("plan"),
    adventuresactivitiestodo: v.array(v.string()),
    localcuisinerecommendations: v.array(v.string()),
    packingchecklist: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return;

    await ctx.db.patch(args.planId, {
      adventuresactivitiestodo: args.adventuresactivitiestodo,
      localcuisinerecommendations: args.localcuisinerecommendations,
      packingchecklist: args.packingchecklist,
      contentGenerationState: {
        ...plan.contentGenerationState,
        adventuresactivitiestodo: true,
        localcuisinerecommendations: true,
        packingchecklist: true,
      },
    });
  },
});

/**
 * Batch 3 Action: EXACTLY N days itinerary & Top places (>= 5 with coordinates).
 */
export const prepareBatch3 = internalAction({
  args: {
    planId: v.id("plan"),
  },
  handler: async (ctx, args) => {
    const data = await ctx.runQuery(internal.plan.getPlanInternal, {
      planId: args.planId,
    });
    if (!data) throw new Error(`Plan ${args.planId} not found`);

    const { plan, settings } = data;
    const noOfDays =
      settings?.fromDate && settings?.toDate
        ? Math.max(1, Math.round((settings.toDate - settings.fromDate) / (1000 * 60 * 60 * 24)) + 1)
        : 3;

    const prompt = buildPrompt({
      destination: plan.nameoftheplace,
      fromDate: settings?.fromDate,
      toDate: settings?.toDate,
      noOfDays,
      companion: settings?.companion,
      activityPreferences: settings?.activityPreferences,
      batch: 3,
    });

    const schema = getBatch3JsonSchema(noOfDays);
    const rawResult = await generateStructured(prompt, schema);

    // Validate with Zod
    const validator = createBatch3Schema(noOfDays);
    const validated = validator.parse(rawResult);

    await ctx.runMutation(internal.plan.patchBatch3, {
      planId: args.planId,
      topplacestovisit: validated.topplacestovisit,
      itinerary: validated.itinerary,
    });
  },
});

export const patchBatch3 = internalMutation({
  args: {
    planId: v.id("plan"),
    topplacestovisit: v.array(
      v.object({
        name: v.string(),
        coordinates: v.object({
          lat: v.number(),
          lng: v.number(),
        }),
      })
    ),
    itinerary: v.array(
      v.object({
        title: v.string(),
        activities: v.object({
          morning: v.array(
            v.object({
              itineraryItem: v.string(),
              briefDescription: v.string(),
            })
          ),
          afternoon: v.array(
            v.object({
              itineraryItem: v.string(),
              briefDescription: v.string(),
            })
          ),
          evening: v.array(
            v.object({
              itineraryItem: v.string(),
              briefDescription: v.string(),
            })
          ),
        }),
      })
    ),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return;

    await ctx.db.patch(args.planId, {
      topplacestovisit: args.topplacestovisit,
      itinerary: args.itinerary,
      contentGenerationState: {
        ...plan.contentGenerationState,
        topplacestovisit: true,
        itinerary: true,
      },
    });
  },
});

// =============================================================================
// PUBLIC & AUTHENTICATED QUERIES
// =============================================================================

/**
 * Get plan for authenticated owner or collaborator.
 */
export const getPlan = query({
  args: {
    planId: v.id("plan"),
  },
  handler: async (ctx, args) => {
    const access = await checkPlanAccess(ctx, args.planId);
    if (!access) {
      return null;
    }
    const { plan, isOwner } = access;

    const settings = await ctx.db
      .query("planSettings")
      .withIndex("by_planId", (q) => q.eq("planId", args.planId))
      .unique();

    return {
      plan,
      settings,
      isOwner,
    };
  },
});

/**
 * Public read-only query for published plans. No auth required.
 * Returns 404-style ConvexError if unpublished or missing.
 */
export const getPublicPlan = query({
  args: {
    planId: v.id("plan"),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) {
      return null;
    }

    const settings = await ctx.db
      .query("planSettings")
      .withIndex("by_planId", (q) => q.eq("planId", args.planId))
      .unique();

    if (!settings || !settings.isPublished) {
      return null;
    }

    return {
      plan,
      settings,
      isOwner: false,
    };
  },
});

/**
 * Gets all plans owned by the user or shared with them.
 */
export const getUserPlans = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // 1. Owned plans
    const ownedPlans = await ctx.db
      .query("plan")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    // 2. Shared plans via access table
    const accessRecords = await ctx.db
      .query("access")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    const sharedPlansList = [];
    for (const record of accessRecords) {
      const plan = await ctx.db.get(record.planId);
      if (plan) {
        sharedPlansList.push(plan);
      }
    }

    const allPlans = [
      ...ownedPlans.map((p) => ({ plan: p, isShared: false })),
      ...sharedPlansList.map((p) => ({ plan: p, isShared: true })),
    ];

    // Attach settings
    const result = [];
    for (const item of allPlans) {
      const settings = await ctx.db
        .query("planSettings")
        .withIndex("by_planId", (q) => q.eq("planId", item.plan._id))
        .unique();

      result.push({
        ...item.plan,
        settings,
        isShared: item.isShared,
      });
    }

    return result;
  },
});

/**
 * Lightweight switcher query for top bar combobox.
 */
export const getAllUserPlansForSwitcher = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const owned = await ctx.db
      .query("plan")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    const access = await ctx.db
      .query("access")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    const items = [];
    for (const p of owned) {
      items.push({ _id: p._id, name: p.nameoftheplace, isShared: false });
    }
    for (const a of access) {
      const p = await ctx.db.get(a.planId);
      if (p) {
        items.push({ _id: p._id, name: p.nameoftheplace, isShared: true });
      }
    }

    return items;
  },
});

// =============================================================================
// EDIT MUTATIONS (OWNER & COLLABORATOR ACCESS)
// =============================================================================

export const updateAbout = mutation({
  args: {
    planId: v.id("plan"),
    abouttheplace: v.string(),
    besttimetovisit: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlanAccess(ctx, args.planId);
    await ctx.db.patch(args.planId, {
      abouttheplace: args.abouttheplace,
      besttimetovisit: args.besttimetovisit,
    });
  },
});

export const updateActivities = mutation({
  args: {
    planId: v.id("plan"),
    adventuresactivitiestodo: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlanAccess(ctx, args.planId);
    await ctx.db.patch(args.planId, {
      adventuresactivitiestodo: args.adventuresactivitiestodo,
    });
  },
});

export const updateCuisines = mutation({
  args: {
    planId: v.id("plan"),
    localcuisinerecommendations: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlanAccess(ctx, args.planId);
    await ctx.db.patch(args.planId, {
      localcuisinerecommendations: args.localcuisinerecommendations,
    });
  },
});

export const updatePackingList = mutation({
  args: {
    planId: v.id("plan"),
    packingchecklist: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlanAccess(ctx, args.planId);
    await ctx.db.patch(args.planId, {
      packingchecklist: args.packingchecklist,
    });
  },
});

export const updateTopPlaces = mutation({
  args: {
    planId: v.id("plan"),
    topplacestovisit: v.array(
      v.object({
        name: v.string(),
        coordinates: v.object({
          lat: v.number(),
          lng: v.number(),
        }),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requirePlanAccess(ctx, args.planId);
    await ctx.db.patch(args.planId, {
      topplacestovisit: args.topplacestovisit,
    });
  },
});

export const updateItinerary = mutation({
  args: {
    planId: v.id("plan"),
    itinerary: v.array(
      v.object({
        title: v.string(),
        activities: v.object({
          morning: v.array(
            v.object({
              itineraryItem: v.string(),
              briefDescription: v.string(),
            })
          ),
          afternoon: v.array(
            v.object({
              itineraryItem: v.string(),
              briefDescription: v.string(),
            })
          ),
          evening: v.array(
            v.object({
              itineraryItem: v.string(),
              briefDescription: v.string(),
            })
          ),
        }),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requirePlanAccess(ctx, args.planId);
    await ctx.db.patch(args.planId, {
      itinerary: args.itinerary,
    });
  },
});

export const addItineraryDay = mutation({
  args: {
    planId: v.id("plan"),
    title: v.string(),
    morningItem: v.string(),
    morningDesc: v.string(),
    afternoonItem: v.string(),
    afternoonDesc: v.string(),
    eveningItem: v.string(),
    eveningDesc: v.string(),
  },
  handler: async (ctx, args) => {
    const { plan } = await requirePlanAccess(ctx, args.planId);

    const newDay = {
      title: args.title,
      activities: {
        morning: [{ itineraryItem: args.morningItem, briefDescription: args.morningDesc }],
        afternoon: [{ itineraryItem: args.afternoonItem, briefDescription: args.afternoonDesc }],
        evening: [{ itineraryItem: args.eveningItem, briefDescription: args.eveningDesc }],
      },
    };

    const updated = [...plan.itinerary, newDay];
    await ctx.db.patch(args.planId, { itinerary: updated });
  },
});

export const deleteItineraryDay = mutation({
  args: {
    planId: v.id("plan"),
    dayIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const { plan } = await requirePlanAccess(ctx, args.planId);
    if (args.dayIndex < 0 || args.dayIndex >= plan.itinerary.length) {
      throw new ConvexError("Invalid day index.");
    }
    const updated = plan.itinerary.filter((_, i) => i !== args.dayIndex);
    await ctx.db.patch(args.planId, { itinerary: updated });
  },
});

// =============================================================================
// SETTINGS & OWNER ONLY MANAGEMENT
// =============================================================================

export const updatePlanSettings = mutation({
  args: {
    planId: v.id("plan"),
    nameoftheplace: v.optional(v.string()),
    currencyCode: v.optional(v.string()),
    activityPreferences: v.optional(v.array(v.string())),
    companion: v.optional(v.string()),
    fromDate: v.optional(v.number()),
    toDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlanOwner(ctx, args.planId);

    if (args.nameoftheplace) {
      await ctx.db.patch(args.planId, {
        nameoftheplace: args.nameoftheplace,
      });
    }

    const settings = await ctx.db
      .query("planSettings")
      .withIndex("by_planId", (q) => q.eq("planId", args.planId))
      .unique();

    if (settings) {
      await ctx.db.patch(settings._id, {
        currencyCode: args.currencyCode !== undefined ? args.currencyCode : settings.currencyCode,
        activityPreferences: args.activityPreferences !== undefined ? args.activityPreferences : settings.activityPreferences,
        companion: args.companion !== undefined ? args.companion : settings.companion,
        fromDate: args.fromDate !== undefined ? args.fromDate : settings.fromDate,
        toDate: args.toDate !== undefined ? args.toDate : settings.toDate,
      });
    }
  },
});

export const togglePublish = mutation({
  args: {
    planId: v.id("plan"),
  },
  handler: async (ctx, args) => {
    await requirePlanOwner(ctx, args.planId);

    const settings = await ctx.db
      .query("planSettings")
      .withIndex("by_planId", (q) => q.eq("planId", args.planId))
      .unique();

    if (!settings) throw new ConvexError("Plan settings not found.");

    const newStatus = !settings.isPublished;
    await ctx.db.patch(settings._id, { isPublished: newStatus });
    return newStatus;
  },
});

export const deletePlan = mutation({
  args: {
    planId: v.id("plan"),
  },
  handler: async (ctx, args) => {
    const { plan } = await requirePlanOwner(ctx, args.planId);

    // Cascading delete
    // 1. Settings
    const settings = await ctx.db
      .query("planSettings")
      .withIndex("by_planId", (q) => q.eq("planId", args.planId))
      .collect();
    for (const s of settings) await ctx.db.delete(s._id);

    // 2. Expenses
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_planId", (q) => q.eq("planId", args.planId))
      .collect();
    for (const e of expenses) await ctx.db.delete(e._id);

    // 3. Invites
    const invites = await ctx.db
      .query("invites")
      .withIndex("by_planId", (q) => q.eq("planId", args.planId))
      .collect();
    for (const inv of invites) await ctx.db.delete(inv._id);

    // 4. Access
    const accessRows = await ctx.db
      .query("access")
      .withIndex("by_planId", (q) => q.eq("planId", args.planId))
      .collect();
    for (const a of accessRows) await ctx.db.delete(a._id);

    // 5. Stored image
    if (plan.storageId) {
      await ctx.storage.delete(plan.storageId);
    }

    // 6. Plan document
    await ctx.db.delete(args.planId);
  },
});

/**
 * Collaborator leaves a shared trip (removes their own access row).
 */
export const leavePlan = mutation({
  args: {
    planId: v.id("plan"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);

    const accessRecord = await ctx.db
      .query("access")
      .withIndex("by_planId_userId", (q) =>
        q.eq("planId", args.planId).eq("userId", identity.subject)
      )
      .unique();

    if (!accessRecord) {
      throw new ConvexError("You are not an active collaborator on this plan.");
    }

    await ctx.db.delete(accessRecord._id);
  },
});
