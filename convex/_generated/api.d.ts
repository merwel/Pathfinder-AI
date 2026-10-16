/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as communityPlans from "../communityPlans.js";
import type * as expenses from "../expenses.js";
import type * as feedback from "../feedback.js";
import type * as http from "../http.js";
import type * as images from "../images.js";
import type * as invites from "../invites.js";
import type * as lib_access from "../lib/access.js";
import type * as payments from "../payments.js";
import type * as plan from "../plan.js";
import type * as rateLimiter from "../rateLimiter.js";
import type * as retrier from "../retrier.js";
import type * as sendInvite from "../sendInvite.js";
import type * as stripe from "../stripe.js";
import type * as users from "../users.js";
import type * as weather from "../weather.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  communityPlans: typeof communityPlans;
  expenses: typeof expenses;
  feedback: typeof feedback;
  http: typeof http;
  images: typeof images;
  invites: typeof invites;
  "lib/access": typeof lib_access;
  payments: typeof payments;
  plan: typeof plan;
  rateLimiter: typeof rateLimiter;
  retrier: typeof retrier;
  sendInvite: typeof sendInvite;
  stripe: typeof stripe;
  users: typeof users;
  weather: typeof weather;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
