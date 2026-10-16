import { v, ConvexError } from "convex/values";
import { mutation } from "./_generated/server";
import { requireIdentity } from "./lib/access";

export const submitFeedback = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);

    if (!args.message.trim()) {
      throw new ConvexError("Feedback message cannot be empty.");
    }

    const feedbackId = await ctx.db.insert("feedback", {
      userId: identity.subject,
      planId: args.planId,
      message: args.message.trim(),
      label: args.label,
    });

    return feedbackId;
  },
});
