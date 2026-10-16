import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { requireIdentity } from "./lib/access";

/**
 * Get current authenticated user profile, credits, and freeCredits.
 * Returns null if user is not in database yet.
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("userId", identity.subject))
      .unique();

    return user;
  },
});

/**
 * Ensure the authenticated user exists in the database.
 * If not, provisions them with 0 credits and 2 freeCredits.
 */
export const syncCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("userId", identity.subject))
      .unique();

    if (existingUser) {
      // Update names if changed in Clerk
      const email = identity.email || existingUser.email;
      const firstName = (identity.givenName as string) || existingUser.firstName;
      const lastName = (identity.familyName as string) || existingUser.lastName;

      if (
        email !== existingUser.email ||
        firstName !== existingUser.firstName ||
        lastName !== existingUser.lastName
      ) {
        await ctx.db.patch(existingUser._id, {
          email,
          firstName,
          lastName,
        });
      }
      return existingUser;
    }

    // Insert new user with default credits
    const email = identity.email || "";
    const newUserId = await ctx.db.insert("users", {
      userId: identity.subject,
      email,
      firstName: (identity.givenName as string) || undefined,
      lastName: (identity.familyName as string) || undefined,
      credits: 0,
      freeCredits: 2,
    });

    return await ctx.db.get(newUserId);
  },
});

/**
 * Internal mutation called by Clerk webhook on user.created / user.updated.
 * Idempotent by clerk userId and email.
 */
export const upsertUserFromWebhook = internalMutation({
  args: {
    userId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      userId: args.userId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      credits: 0,
      freeCredits: 2,
    });
  },
});

/**
 * Internal mutation called by Clerk webhook on user.deleted.
 * Performs a complete cascading delete:
 * - User's plans and their settings, expenses, invites, access rows, and stored images
 * - Access rows granted to this user on other plans
 * - Invites sent to or created for this user
 * - Expenses created by this user
 * - Feedback submitted by this user
 * - The user record itself
 */
export const deleteUserCascade = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Delete all plans owned by the user (and everything attached to them)
    const userPlans = await ctx.db
      .query("plan")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const plan of userPlans) {
      // Delete settings
      const settings = await ctx.db
        .query("planSettings")
        .withIndex("by_planId", (q) => q.eq("planId", plan._id))
        .collect();
      for (const s of settings) {
        await ctx.db.delete(s._id);
      }

      // Delete expenses on plan
      const expenses = await ctx.db
        .query("expenses")
        .withIndex("by_planId", (q) => q.eq("planId", plan._id))
        .collect();
      for (const e of expenses) {
        await ctx.db.delete(e._id);
      }

      // Delete invites on plan
      const invites = await ctx.db
        .query("invites")
        .withIndex("by_planId", (q) => q.eq("planId", plan._id))
        .collect();
      for (const inv of invites) {
        await ctx.db.delete(inv._id);
      }

      // Delete access rows on plan
      const accessRows = await ctx.db
        .query("access")
        .withIndex("by_planId", (q) => q.eq("planId", plan._id))
        .collect();
      for (const a of accessRows) {
        await ctx.db.delete(a._id);
      }

      // Delete stored image in storage if present
      if (plan.storageId) {
        await ctx.storage.delete(plan.storageId);
      }

      // Delete plan
      await ctx.db.delete(plan._id);
    }

    // 2. Delete access rows granted to this user on ANY other plans
    const otherAccessRows = await ctx.db
      .query("access")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    for (const a of otherAccessRows) {
      await ctx.db.delete(a._id);
    }

    // 3. Delete feedback submitted by this user
    const userFeedback = await ctx.db
      .query("feedback")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    for (const f of userFeedback) {
      await ctx.db.delete(f._id);
    }

    // 4. Delete the user row
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("userId", args.userId))
      .unique();
    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});
