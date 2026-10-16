import { v, ConvexError } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireIdentity, requirePlanOwner, checkPlanOwner } from "./lib/access";
import { rateLimiter } from "./rateLimiter";
import { Resend } from "resend";

/**
 * Validates token against the current user's email, creates an access row,
 * and permanently deletes the invite token.
 * Prevents token re-use and rejects if claimed by mismatched email.
 */
export const grantAccessByToken = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const userEmail = (identity.email || "").toLowerCase().trim();

    // 1. Locate invite by token
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!invite) {
      throw new ConvexError(
        "Invalid or expired invite token. The invite may have already been accepted or revoked."
      );
    }

    // 2. Fetch target plan
    const plan = await ctx.db.get(invite.planId);
    if (!plan) {
      // Clean up orphaned invite
      await ctx.db.delete(invite._id);
      throw new ConvexError("The requested trip plan no longer exists.");
    }

    // 3. Verify user's email matches the invite recipient email
    const invitedEmail = invite.email.toLowerCase().trim();
    if (userEmail !== invitedEmail) {
      throw new ConvexError(
        `This invitation was sent to ${invite.email}. You are currently signed in as ${userEmail || "another account"}. Please sign in with the invited email address.`
      );
    }

    // 4. Check if caller is already the plan owner
    if (plan.userId === identity.subject) {
      await ctx.db.delete(invite._id);
      return { planId: invite.planId, isOwner: true };
    }

    // 5. Check if caller already has an access record
    const existingAccess = await ctx.db
      .query("access")
      .withIndex("by_planId_userId", (q) =>
        q.eq("planId", invite.planId).eq("userId", identity.subject)
      )
      .unique();

    if (existingAccess) {
      await ctx.db.delete(invite._id);
      return { planId: invite.planId, alreadyHasAccess: true };
    }

    // 6. Grant collaborator access
    await ctx.db.insert("access", {
      planId: invite.planId,
      userId: identity.subject,
      email: userEmail,
    });

    // 7. Delete the invite row (preventing duplicate claims)
    await ctx.db.delete(invite._id);

    return { planId: invite.planId, success: true };
  },
});

/**
 * Lists pending invites for a plan (Owner only).
 */
export const getPlanInvites = query({
  args: {
    planId: v.id("plan"),
  },
  handler: async (ctx, args) => {
    const owner = await checkPlanOwner(ctx, args.planId);
    if (!owner) {
      return [];
    }

    const invites = await ctx.db
      .query("invites")
      .withIndex("by_planId", (q) => q.eq("planId", args.planId))
      .collect();

    return invites;
  },
});

/**
 * Lists active collaborators with access to the plan (Owner only).
 */
export const getPlanCollaborators = query({
  args: {
    planId: v.id("plan"),
  },
  handler: async (ctx, args) => {
    const owner = await checkPlanOwner(ctx, args.planId);
    if (!owner) {
      return [];
    }

    const accessRows = await ctx.db
      .query("access")
      .withIndex("by_planId", (q) => q.eq("planId", args.planId))
      .collect();

    const result = [];
    for (const a of accessRows) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("userId", a.userId))
        .unique();

      const displayName = user
        ? [user.firstName, user.lastName].filter(Boolean).join(" ") || a.email
        : a.email;

      result.push({
        _id: a._id,
        userId: a.userId,
        email: a.email,
        name: displayName,
      });
    }

    return result;
  },
});

/**
 * Revokes a pending invite (Owner only).
 */
export const revokeInvite = mutation({
  args: {
    inviteId: v.id("invites"),
    planId: v.id("plan"),
  },
  handler: async (ctx, args) => {
    await requirePlanOwner(ctx, args.planId);
    const invite = await ctx.db.get(args.inviteId);
    if (invite && invite.planId === args.planId) {
      await ctx.db.delete(args.inviteId);
    }
  },
});

/**
 * Revokes collaborator access (Owner only).
 */
export const revokeAccess = mutation({
  args: {
    accessId: v.id("access"),
    planId: v.id("plan"),
  },
  handler: async (ctx, args) => {
    await requirePlanOwner(ctx, args.planId);
    const accessRow = await ctx.db.get(args.accessId);
    if (accessRow && accessRow.planId === args.planId) {
      await ctx.db.delete(args.accessId);
    }
  },
});

/**
 * Creates an invite row with a random crypto token.
 */
export const createInviteRecord = internalMutation({
  args: {
    planId: v.id("plan"),
    email: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("invites", {
      planId: args.planId,
      email: args.email,
      token: args.token,
    });
  },
});

/**
 * Prepares an invite record: checks ownership, checks rate limits, generates
 * a cryptographically secure token (48 hex chars), and inserts the invite.
 */
export const prepareInvite = internalMutation({
  args: {
    planId: v.id("plan"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const { plan, identity } = await requirePlanOwner(ctx, args.planId);

    // Rate limit 1: sendEmailInviteUser (max 10 per day per user)
    const userLimit = await rateLimiter.limit(ctx, "sendEmailInviteUser", {
      key: identity.subject,
    });
    if (!userLimit.ok) {
      throw new ConvexError(
        "You have reached your daily invitation limit (10 per day). Please try again tomorrow."
      );
    }

    // Rate limit 2: sendEmailInvitePlan (max 3 per plan per day)
    const planLimit = await rateLimiter.limit(ctx, "sendEmailInvitePlan", {
      key: args.planId,
    });
    if (!planLimit.ok) {
      throw new ConvexError(
        "This plan has reached its daily invitation limit (3 per day). Please try again tomorrow."
      );
    }

    // Check if invite already exists for this email
    const existing = await ctx.db
      .query("invites")
      .withIndex("by_planId_email", (q) =>
        q.eq("planId", args.planId).eq("email", args.email.toLowerCase().trim())
      )
      .unique();

    if (existing) {
      throw new ConvexError("An active invitation has already been sent to this email address.");
    }

    // Generate random token (24 bytes = 48 hex characters)
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const token = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const inviteId = await ctx.db.insert("invites", {
      planId: args.planId,
      email: args.email.toLowerCase().trim(),
      token,
    });

    const ownerUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("userId", identity.subject))
      .unique();

    const ownerName = ownerUser
      ? [ownerUser.firstName, ownerUser.lastName].filter(Boolean).join(" ") || ownerUser.email
      : identity.email || "Trip Owner";

    return {
      inviteId,
      token,
      planName: plan.nameoftheplace,
      ownerName,
    };
  },
});

/**
 * Deletes an invite record if email sending fails.
 */
export const deleteInviteRecord = internalMutation({
  args: {
    inviteId: v.id("invites"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.inviteId);
  },
});

