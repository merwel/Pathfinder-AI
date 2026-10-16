import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    userId: v.string(), // Clerk ID
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    credits: v.number(), // default 0
    freeCredits: v.number(), // default 2
  })
    .index("by_clerk_id", ["userId"])
    .index("by_email", ["email"]),

  plan: defineTable({
    userId: v.string(),
    nameoftheplace: v.string(),
    userPrompt: v.string(),
    isGeneratedUsingAI: v.boolean(),
    imageUrl: v.optional(v.string()),
    storageId: v.union(v.id("_storage"), v.null()),
    abouttheplace: v.string(),
    besttimetovisit: v.string(),
    adventuresactivitiestodo: v.array(v.string()),
    localcuisinerecommendations: v.array(v.string()),
    packingchecklist: v.array(v.string()),
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
    contentGenerationState: v.object({
      imagination: v.boolean(),
      abouttheplace: v.boolean(),
      adventuresactivitiestodo: v.boolean(),
      topplacestovisit: v.boolean(),
      itinerary: v.boolean(),
      localcuisinerecommendations: v.boolean(),
      packingchecklist: v.boolean(),
      besttimetovisit: v.boolean(),
    }),
  }).index("by_userId", ["userId"]),

  planSettings: defineTable({
    planId: v.id("plan"),
    userId: v.string(),
    currencyCode: v.optional(v.string()),
    activityPreferences: v.optional(v.array(v.string())),
    fromDate: v.optional(v.number()), // epoch ms
    toDate: v.optional(v.number()), // epoch ms
    companion: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
  })
    .index("by_planId", ["planId"])
    .index("by_planId_userId", ["planId", "userId"])
    .index("by_isPublished", ["isPublished"])
    .index("by_isPublished_companion", ["isPublished", "companion"]),

  expenses: defineTable({
    planId: v.id("plan"),
    userId: v.string(),
    amount: v.number(),
    purpose: v.string(),
    category: v.union(
      v.literal("food"),
      v.literal("commute"),
      v.literal("shopping"),
      v.literal("gifts"),
      v.literal("accommodation"),
      v.literal("others")
    ),
    date: v.string(), // ISO string
  }).index("by_planId", ["planId"]),

  invites: defineTable({
    planId: v.id("plan"),
    email: v.string(),
    token: v.string(),
  })
    .index("by_planId", ["planId"])
    .index("by_planId_email", ["planId", "email"])
    .index("by_token", ["token"]),

  access: defineTable({
    planId: v.id("plan"),
    userId: v.string(),
    email: v.string(),
  })
    .index("by_planId", ["planId"])
    .index("by_userId", ["userId"])
    .index("by_planId_userId", ["planId", "userId"]),

  feedback: defineTable({
    userId: v.string(),
    planId: v.optional(v.id("plan")),
    message: v.string(),
    label: v.union(
      v.literal("issue"),
      v.literal("idea"),
      v.literal("question"),
      v.literal("complaint"),
      v.literal("featurerequest"),
      v.literal("other")
    ),
  })
    .index("by_planId", ["planId"])
    .index("by_userId", ["userId"]),

  payments: defineTable({
    paymentId: v.string(), // Stripe session ID
    userId: v.string(),
    email: v.string(),
    amount: v.number(),
    currency: v.string(),
    creditsGranted: v.number(),
    status: v.union(v.literal("initiated"), v.literal("paid"), v.literal("failed")),
    created_at: v.number(),
  })
    .index("by_paymentId", ["paymentId"])
    .index("by_email", ["email"]),
});
