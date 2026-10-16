import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

export interface PublishedPlanItem {
  _id: string;
  nameoftheplace: string;
  imageUrl?: string;
  abouttheplace: string;
  fromDate?: number;
  toDate?: number;
  companion?: string;
  currencyCode?: string;
  activityPreferences?: string[];
  ownerName?: string;
}

/**
 * Returns the most recently published plans for the landing page showcase and community explorer.
 * No hardcoded IDs. Returns empty array if none are published yet.
 */
export const latestPublished = query({
  args: {
    limit: v.optional(v.number()),
    companion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 8;

    let settingsList: Doc<"planSettings">[];

    if (args.companion && args.companion !== "all") {
      settingsList = await ctx.db
        .query("planSettings")
        .withIndex("by_isPublished_companion", (q) =>
          q.eq("isPublished", true).eq("companion", args.companion)
        )
        .take(limit);
    } else {
      settingsList = await ctx.db
        .query("planSettings")
        .withIndex("by_isPublished", (q) => q.eq("isPublished", true))
        .take(limit);
    }

    const results: PublishedPlanItem[] = [];

    for (const setting of settingsList) {
      const plan = await ctx.db.get(setting.planId);
      if (plan) {
        // Fetch owner name if available
        const owner = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("userId", plan.userId))
          .unique();

        const ownerName = owner
          ? [owner.firstName, owner.lastName].filter(Boolean).join(" ") || "Pathfinder"
          : "Pathfinder";

        results.push({
          _id: plan._id,
          nameoftheplace: plan.nameoftheplace,
          imageUrl: plan.imageUrl,
          abouttheplace: plan.abouttheplace,
          fromDate: setting.fromDate,
          toDate: setting.toDate,
          companion: setting.companion,
          currencyCode: setting.currencyCode,
          activityPreferences: setting.activityPreferences,
          ownerName,
        });
      }
    }

    return results;
  },
});

/**
 * Paginated query for /community-plans page using Convex pagination.
 */
export const getPaginatedPublished = query({
  args: {
    paginationOpts: paginationOptsValidator,
    companion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let settingsPage;

    if (args.companion && args.companion !== "all") {
      settingsPage = await ctx.db
        .query("planSettings")
        .withIndex("by_isPublished_companion", (q) =>
          q.eq("isPublished", true).eq("companion", args.companion)
        )
        .order("desc")
        .paginate(args.paginationOpts);
    } else {
      settingsPage = await ctx.db
        .query("planSettings")
        .withIndex("by_isPublished", (q) => q.eq("isPublished", true))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    const page: PublishedPlanItem[] = [];
    for (const setting of settingsPage.page) {
      const plan = await ctx.db.get(setting.planId);
      if (plan) {
        const owner = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("userId", plan.userId))
          .unique();

        const ownerName = owner
          ? [owner.firstName, owner.lastName].filter(Boolean).join(" ") || "Voyager"
          : "Pathfinder";

        page.push({
          _id: plan._id,
          nameoftheplace: plan.nameoftheplace,
          imageUrl: plan.imageUrl,
          abouttheplace: plan.abouttheplace,
          fromDate: setting.fromDate,
          toDate: setting.toDate,
          companion: setting.companion,
          currencyCode: setting.currencyCode,
          activityPreferences: setting.activityPreferences,
          ownerName,
        });
      }
    }

    return {
      ...settingsPage,
      page,
    };
  },
});
