import { RateLimiter, HOUR, DAY } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  generatePlan: {
    kind: "token bucket",
    rate: 5,
    period: HOUR,
    capacity: 5,
  },
  sendEmailInviteUser: {
    kind: "token bucket",
    rate: 10,
    period: DAY,
    capacity: 10,
  },
  sendEmailInvitePlan: {
    kind: "token bucket",
    rate: 3,
    period: DAY,
    capacity: 3,
  },
});
