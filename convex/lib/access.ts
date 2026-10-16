import { ConvexError } from "convex/values";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export interface UserIdentity {
  subject: string; // Clerk user ID
  email?: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  nickname?: string;
  pictureUrl?: string;
  [key: string]: unknown;
}

/**
 * Requires that the caller has a valid authenticated session.
 * Throws a friendly ConvexError if unauthenticated.
 */
export async function requireIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Authentication required. Please sign in to continue.");
  }
  return identity;
}

/**
 * Requires that the caller is the registered owner of the plan.
 * Throws a ConvexError if not found or if the caller is not the owner.
 */
export async function requirePlanOwner(
  ctx: QueryCtx | MutationCtx,
  planId: Id<"plan">
) {
  const identity = await requireIdentity(ctx);
  const plan = await ctx.db.get(planId);

  if (!plan) {
    throw new ConvexError("Plan not found or has been deleted.");
  }

  if (plan.userId !== identity.subject) {
    throw new ConvexError("Forbidden: Only the trip owner can perform this operation.");
  }

  return { identity, plan };
}

/**
 * Checks if the caller has access to the plan without throwing an error.
 * Returns null if unauthenticated, plan not found, or access not permitted.
 */
export async function checkPlanAccess(
  ctx: QueryCtx | MutationCtx,
  planId: Id<"plan">
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }
  const plan = await ctx.db.get(planId);
  if (!plan) {
    return null;
  }

  // Owner check
  if (plan.userId === identity.subject) {
    return { identity, plan, isOwner: true };
  }

  // Collaborator access record check
  const accessRecord = await ctx.db
    .query("access")
    .withIndex("by_planId_userId", (q) =>
      q.eq("planId", planId).eq("userId", identity.subject)
    )
    .unique();

  if (accessRecord) {
    return { identity, plan, isOwner: false };
  }

  return null;
}

/**
 * Checks if the caller is the registered owner without throwing an error.
 * Returns null if unauthenticated, plan not found, or not the owner.
 */
export async function checkPlanOwner(
  ctx: QueryCtx | MutationCtx,
  planId: Id<"plan">
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const plan = await ctx.db.get(planId);
  if (!plan) return null;
  if (plan.userId !== identity.subject) return null;
  return { identity, plan };
}

/**
 * Requires that the caller has access to the plan:
 * either as the plan owner OR as an invited collaborator with an access record.
 * Throws a ConvexError if neither condition is satisfied.
 */
export async function requirePlanAccess(
  ctx: QueryCtx | MutationCtx,
  planId: Id<"plan">
) {
  const access = await checkPlanAccess(ctx, planId);
  if (!access) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Authentication required. Please sign in to continue.");
    }
    const plan = await ctx.db.get(planId);
    if (!plan) {
      throw new ConvexError("Plan not found or has been deleted.");
    }
    throw new ConvexError("Forbidden: You do not have permission to view or edit this trip plan.");
  }
  return access;
}

