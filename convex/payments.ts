import { query } from "./_generated/server";

/**
 * Checks whether Stripe payment processing is configured on the backend.
 * Returns false if STRIPE_SECRET_KEY is omitted, allowing the entire app
 * to operate in free-credits mode with pricing UI cleanly hidden.
 */
export const isPaymentsEnabled = query({
  args: {},
  handler: async () => {
    const key = process.env.STRIPE_SECRET_KEY;
    return Boolean(key && key.length > 5 && key !== "placeholder");
  },
});
