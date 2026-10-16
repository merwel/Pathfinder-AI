import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireIdentity, requirePlanAccess, checkPlanAccess } from "./lib/access";

const categoryUnion = v.union(
  v.literal("food"),
  v.literal("commute"),
  v.literal("shopping"),
  v.literal("gifts"),
  v.literal("accommodation"),
  v.literal("others")
);

export const getExpenses = query({
  args: {
    planId: v.id("plan"),
  },
  handler: async (ctx, args) => {
    const access = await checkPlanAccess(ctx, args.planId);
    if (!access) {
      return null;
    }
    const { plan, isOwner } = access;

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_planId", (q) => q.eq("planId", args.planId))
      .collect();

    const settings = await ctx.db
      .query("planSettings")
      .withIndex("by_planId", (q) => q.eq("planId", args.planId))
      .unique();

    // Gather distinct contributors (owner + collaborators)
    const accessRows = await ctx.db
      .query("access")
      .withIndex("by_planId", (q) => q.eq("planId", args.planId))
      .collect();

    const userIds = new Set<string>();
    userIds.add(plan.userId);
    for (const a of accessRows) userIds.add(a.userId);
    for (const e of expenses) userIds.add(e.userId);

    const contributors: { userId: string; name: string; email: string }[] = [];
    for (const uid of Array.from(userIds)) {
      const u = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("userId", uid))
        .unique();

      if (u) {
        const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ");
        contributors.push({
          userId: uid,
          name: fullName || u.email || "Traveler",
          email: u.email,
        });
      } else {
        contributors.push({
          userId: uid,
          name: "Collaborator",
          email: "",
        });
      }
    }

    // Sort expenses chronologically descending
    const sortedExpenses = [...expenses].sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    return {
      expenses: sortedExpenses,
      currencyCode: settings?.currencyCode || "USD",
      contributors,
      isOwner,
      placeName: plan.nameoftheplace,
    };
  },
});

export const addExpense = mutation({
  args: {
    planId: v.id("plan"),
    amount: v.number(),
    purpose: v.string(),
    category: categoryUnion,
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    await requirePlanAccess(ctx, args.planId);

    if (args.amount <= 0) {
      throw new ConvexError("Expense amount must be greater than zero.");
    }
    if (!args.purpose.trim()) {
      throw new ConvexError("Purpose or description cannot be empty.");
    }

    const expenseId = await ctx.db.insert("expenses", {
      planId: args.planId,
      userId: identity.subject,
      amount: Math.round(args.amount * 100) / 100,
      purpose: args.purpose.trim(),
      category: args.category,
      date: args.date,
    });

    return expenseId;
  },
});

export const updateExpense = mutation({
  args: {
    expenseId: v.id("expenses"),
    amount: v.number(),
    purpose: v.string(),
    category: categoryUnion,
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) {
      throw new ConvexError("Expense not found.");
    }

    await requirePlanAccess(ctx, expense.planId);

    if (args.amount <= 0) {
      throw new ConvexError("Expense amount must be greater than zero.");
    }
    if (!args.purpose.trim()) {
      throw new ConvexError("Purpose or description cannot be empty.");
    }

    await ctx.db.patch(args.expenseId, {
      amount: Math.round(args.amount * 100) / 100,
      purpose: args.purpose.trim(),
      category: args.category,
      date: args.date,
    });
  },
});

export const deleteExpense = mutation({
  args: {
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) {
      throw new ConvexError("Expense not found.");
    }

    await requirePlanAccess(ctx, expense.planId);
    await ctx.db.delete(args.expenseId);
  },
});
