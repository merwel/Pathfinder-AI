import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { FunctionReference } from "convex/server";

export const MAX_ATTEMPTS = 5;
export const INITIAL_DELAY_MS = 1000;
export const BACKOFF_BASE = 2;

/**
 * Calculates exponential backoff delay in milliseconds.
 * attempt is 1-indexed (1, 2, 3, 4, 5).
 */
export function getBackoffDelay(attempt: number): number {
  return INITIAL_DELAY_MS * Math.pow(BACKOFF_BASE, attempt - 1);
}

/**
 * Executes a background action with exponential backoff retry.
 * Initial retry delay: 1000 ms
 * Base: 2
 * Max attempts: 5 total
 * Logs each failure with details.
 */
export const runWithRetry = internalAction({
  args: {
    actionName: v.string(),
    payload: v.any(),
    attempt: v.number(),
  },
  handler: async (ctx, args) => {
    const { actionName, payload, attempt } = args;

    try {
      // Dispatch to specific action
      switch (actionName) {
        case "images.generateAndStore":
          await ctx.runAction(internal.images.generateAndStore, payload);
          break;
        case "plan.prepareBatch1":
          await ctx.runAction(internal.plan.prepareBatch1, payload);
          break;
        case "plan.prepareBatch2":
          await ctx.runAction(internal.plan.prepareBatch2, payload);
          break;
        case "plan.prepareBatch3":
          await ctx.runAction(internal.plan.prepareBatch3, payload);
          break;
        default:
          throw new Error(`Unknown actionName for retry: ${actionName}`);
      }
    } catch (error: any) {
      console.error(
        `[Retrier] Action "${actionName}" failed on attempt ${attempt}/${MAX_ATTEMPTS}:`,
        error?.message || error
      );

      if (attempt < MAX_ATTEMPTS) {
        const nextAttempt = attempt + 1;
        const delayMs = getBackoffDelay(attempt);
        console.log(
          `[Retrier] Scheduling retry attempt ${nextAttempt}/${MAX_ATTEMPTS} for "${actionName}" in ${delayMs}ms`
        );

        // Schedule next attempt with exponential backoff
        await ctx.runMutation(internal.retrier.scheduleRetry, {
          actionName,
          payload,
          attempt: nextAttempt,
          delayMs,
        });
      } else {
        console.error(
          `[Retrier] Action "${actionName}" reached maximum attempts (${MAX_ATTEMPTS}). No further retries.`
        );
      }
    }
  },
});

/**
 * Schedules a retried action using Convex scheduler.
 */
export const scheduleRetry = internalMutation({
  args: {
    actionName: v.string(),
    payload: v.any(),
    attempt: v.number(),
    delayMs: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(args.delayMs, internal.retrier.runWithRetry, {
      actionName: args.actionName,
      payload: args.payload,
      attempt: args.attempt,
    });
  },
});
