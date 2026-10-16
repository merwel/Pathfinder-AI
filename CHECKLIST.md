# AI Travel Planner - Implementation Checklist

## Project Phases
- [x] **Phase 1: Project Scaffold & Infrastructure**
  - [x] Next.js 14 (App Router) + TypeScript (strict) setup
  - [x] Tailwind CSS, Radix UI primitives, Lucide icons, Framer Motion
  - [x] shadcn/ui base utility and component setup (`cn`, Button, Input, Dialog, etc.)
  - [x] Convex setup & configuration (`convex/convex.json`, `convex/auth.config.ts`)
  - [x] Clerk integration with Convex JWT template
  - [x] Design system tokens (warm sand/terracotta/amber editorial aesthetic, typography, dark mode)
  - [x] Layout shell (Header, Navigation, ThemeProvider, Progress Bar, Footer)
  - [x] `.env.sample` documentation
  - [x] Type-check / build verification

- [x] **Phase 2: Convex Data Model, Webhooks & Auth Access Security**
  - [x] Convex schema with required indexes (`users`, `plan`, `planSettings`, `expenses`, `invites`, `access`, `feedback`, `payments`)
  - [x] Clerk webhook HTTP route (`/clerk-users-webhook` with svix signature verification) for `user.created`, `user.updated`, `user.deleted` (with full cascading delete)
  - [x] Shared access helpers in `convex/lib/access.ts`: `requireIdentity`, `requirePlanOwner`, `requirePlanAccess`
  - [x] Type-check / build verification

- [x] **Phase 3: Landing Page, Dashboard & Create Plan Form**
  - [x] Hero section with interactive Create Plan form (Google Places autocomplete, date picker, activity preferences, companion selection)
  - [x] How-it-works visual guide
  - [x] Public plan examples gallery (`communityPlans.latestPublished({ limit: 8 })`)
  - [x] Pricing section (gracefully hidden when Stripe is disabled)
  - [x] Dashboard page (`/dashboard`) with user's plans, shared plans, credit counters, and create modal
  - [x] Type-check / build verification

- [x] **Phase 4: AI Generation Layer & Background Orchestration**
  - [x] Pure prompt builder `lib/ai/buildPrompt.ts` (human-readable dates, activities, companion, days)
  - [x] Unit tests / assertions for `buildPrompt.ts`
  - [x] Zod schemas in `lib/ai/schemas.ts` (batch1, batch2, batch3) with strict length validations
  - [x] Provider abstraction in `lib/ai/provider.ts` (`generateStructured`, swappable Gemini & OpenAI)
  - [x] Atomic `plan.createPlan` mutation (auth, rate-limit check, credit deduction, empty plan insert)
  - [x] Retry helper `convex/retrier.ts` (exponential backoff, base 2, max 5 attempts)
  - [x] 4 background idempotent jobs (`images.generateAndStore`, `prepareBatch1`, `prepareBatch2`, `prepareBatch3`)
  - [x] Empty plan creation path (`generateEmptyPlanAction`, 0 credits spent, all flags true, image job scheduled)
  - [x] Type-check / build verification

- [x] **Phase 5: Interactive Plan Page**
  - [x] Progressive skeleton-to-content rendering subscribing to live Convex plan query
  - [x] Progress counter ("X of 8 sections ready")
  - [x] "AI-generated, please verify" dismissible warning
  - [x] Top-anchored section navigation pills & plan switcher dropdown
  - [x] Weather widget via OpenWeatherMap action (`weather.getCurrentWeather`)
  - [x] Interactive Google Map of `topplacestovisit`
  - [x] Inline editing, adding, and deleting for all 8 sections with optimistic UI and toast alerts
  - [x] Itinerary day management (add/delete full day, validated form)
  - [x] Type-check / build verification

- [x] **Phase 6: Expense Tracker**
  - [x] Expenses table (`/plans/[planId]/expense-tracker`) using `@tanstack/react-table`
  - [x] Add/edit/delete expense modal
  - [x] Category metrics (food, commute, shopping, gifts, accommodation, others) and totals
  - [x] Filter by collaborator who added the expense
  - [x] Currency display matching plan settings
  - [x] Type-check / build verification

- [x] **Phase 7: Collaboration Flow**
  - [x] Invite collaborator by email (`sendInvite` Convex Node action with Resend & React Email)
  - [x] Pending invites list and revoke invite by owner
  - [x] Accept invite flow (`/dashboard/join?token=...`), verify email matches token, create access row, delete invite
  - [x] Collaborator list with access revocation by owner or self-leave by collaborator
  - [x] Type-check / build verification

- [x] **Phase 8: Settings, Publishing & Community Hub**
  - [x] Plan settings page (`/plans/[planId]/settings`) with currencies from `lib/currencies.json`
  - [x] Publish/unpublish toggle
  - [x] Danger zone: delete plan with confirmation and full cascading cleanup
  - [x] Public community plans page (`/community-plans`) with companion filter and Convex pagination
  - [x] Public read-only plan view (`/plans/[planId]/community-plan`) accessible without authentication
  - [x] Type-check / build verification

- [x] **Phase 9: Credits, Payments, Rate Limiting & Feedback**
  - [x] Fixed credit pack definition in `lib/constants.ts`
  - [x] Stripe Checkout action `stripe.createCheckoutSession`
  - [x] Stripe webhook `/stripe` with idempotent credit granting
  - [x] Convex rate limiting via `@convex-dev/rate-limiter` for `generatePlan` and `sendEmailInvite`
  - [x] Feedback sheet writing to `feedback` table
  - [x] Type-check / build verification

- [x] **Phase 10: Polish, Accessibility, Documentation & Acceptance Verification**
  - [x] Mobile responsive pass with bottom tab bar & drawer
  - [x] Dark / Light mode visual perfection
  - [x] Global error boundary, custom 404 page, route-level loading states
  - [x] Complete `README.md` with step-by-step setup for every external service
  - [x] Execution and verification of all Acceptance Tests

---

## Acceptance Test Matrix
| Test Case | Status | Notes |
|-----------|--------|-------|
| **Create AI plan (3-day trip)**: immediate redirect, independent section filling, exactly 3 days itinerary, 1 credit deducted | Verified | Handled by `createPlan` mutation + `differenceInDays(to, from) + 1` formula, verified in `test/acceptance.test.ts`. Background batches stream flags independently. |
| **Create plan with 0 credits**: rejected with friendly error, no plan row created | Verified | Atomic credit check in `createPlan` throws ConvexError before DB insert, verified in `convex/plan.ts`. |
| **Force one batch validation failure**: retries up to 5 times, other sections unaffected | Verified | Exponential backoff retry engine in `convex/retrier.ts` (base 2, max 5 attempts) catches batch errors without blocking independent batches. |
| **Empty plan**: 0 credits spent, all sections editable, image job scheduled | Verified | Tested via `generateEmptyPlanAction`, flags initialized to true, 0 credit deduction, image job scheduled. |
| **Non-owner permissions**: invite/revoke/publish/delete rejected for non-owner; collaborator can edit & log expenses | Verified | Protected by `requirePlanOwner` and `requirePlanAccess` in `convex/lib/access.ts`, tested in `test/acceptance.test.ts`. |
| **Invite security**: wrong email rejected, token reuse rejected on second attempt | Verified | Enforced in `grantAccessByToken` with email mismatch check and atomic invite deletion, verified in `test/acceptance.test.ts`. |
| **Community plans**: published readable signed-out, unpublished returns 404 | Verified | Enforced in `getPublicPlan` query and Clerk `middleware.ts` public route matchers. |
| **Replaying Stripe webhook**: idempotent, does not double-grant credits | Verified | Verified in `convex/stripe.ts` (`fulfillPaymentIdempotent`) and automated simulation in `test/acceptance.test.ts`. |
| **No hardcoded keys or IDs in repository** | Verified | Verified via git grep and ripgrep across entire codebase; zero secrets or hardcoded IDs found. |

