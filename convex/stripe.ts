import { v, ConvexError } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import Stripe from "stripe";
import { CREDIT_PACK } from "../lib/constants";

/**
 * Creates a Stripe Checkout Session for the one-time credit pack.
 * Authenticated caller only.
 */
export const createCheckoutSession = action({
  args: {},
  handler: async (ctx) => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || stripeKey === "placeholder") {
      throw new ConvexError("Stripe payments are not configured on this server.");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Authentication required to purchase credits.");
    }

    const hostingUrl =
      process.env.HOSTING_URL ||
      process.env.NEXT_PUBLIC_HOSTING_URL ||
      "http://localhost:3000";

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2024-06-20" as any,
    });

    const userEmail = identity.email || "";

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: CREDIT_PACK.currency,
            product_data: {
              name: CREDIT_PACK.name,
              description: CREDIT_PACK.description,
            },
            unit_amount: CREDIT_PACK.priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: userEmail || undefined,
      metadata: {
        userId: identity.subject,
        credits: String(CREDIT_PACK.credits),
      },
      success_url: `${hostingUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${hostingUrl}/dashboard?payment=cancelled`,
    });

    // Record initiated payment in database
    await ctx.runMutation(internal.stripe.recordPaymentInitiated, {
      paymentId: session.id,
      userId: identity.subject,
      email: userEmail,
      amount: CREDIT_PACK.priceInCents,
      currency: CREDIT_PACK.currency,
      creditsGranted: CREDIT_PACK.credits,
    });

    return { url: session.url };
  },
});

export const recordPaymentInitiated = internalMutation({
  args: {
    paymentId: v.string(),
    userId: v.string(),
    email: v.string(),
    amount: v.number(),
    currency: v.string(),
    creditsGranted: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("payments", {
      paymentId: args.paymentId,
      userId: args.userId,
      email: args.email,
      amount: args.amount,
      currency: args.currency,
      creditsGranted: args.creditsGranted,
      status: "initiated",
      created_at: Date.now(),
    });
  },
});

/**
 * Idempotently marks the payment as paid and grants credits to the user.
 * Replaying this mutation NEVER grants credits twice.
 */
export const fulfillPaymentIdempotent = internalMutation({
  args: {
    paymentId: v.string(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_paymentId", (q) => q.eq("paymentId", args.paymentId))
      .unique();

    if (!payment) {
      console.warn(`[Stripe Fulfill] Payment ${args.paymentId} not found in database.`);
      return;
    }

    // Idempotency check: if already fulfilled, do nothing
    if (payment.status === "paid") {
      console.log(`[Stripe Fulfill] Payment ${args.paymentId} was already fulfilled. Skipping duplicate grant.`);
      return;
    }

    // 1. Mark payment as paid
    await ctx.db.patch(payment._id, {
      status: "paid",
    });

    // 2. Increment credits on the user row
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("userId", payment.userId))
      .unique();

    if (user) {
      await ctx.db.patch(user._id, {
        credits: (user.credits || 0) + payment.creditsGranted,
      });
      console.log(
        `[Stripe Fulfill] Granted ${payment.creditsGranted} credits to user ${payment.userId}. New total: ${
          (user.credits || 0) + payment.creditsGranted
        }`
      );
    } else {
      console.error(`[Stripe Fulfill] User ${payment.userId} not found when fulfilling payment.`);
    }
  },
});
