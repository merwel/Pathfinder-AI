# Pathfinder AI — Editorial AI Travel Planner

A production-grade, editorial-style full-stack travel planner web application built with **Next.js 14 (App Router)**, **TypeScript (strict)**, **Tailwind CSS**, **Convex**, **Clerk**, **Google Gemini**, **Google Maps**, **OpenWeatherMap**, **Unsplash**, and **Resend**.

---

## 🎨 UI & Aesthetic Direction
- **Editorial Travel-Magazine Design**: Luxurious typography with **Playfair Display** serif headings paired with clean sans-serif body text.
- **Warm Sand & Terracotta Palette**: Warm desert sand tones (`#fdfbf7`, `#f4ebe1`, `#e3cdb9`), terracotta accents (`#c85a32`, `#a8431e`), and deep slate typography with full light and dark mode support.
- **Micro-Animations & Smooth Motion**: Fluid transitions powered by Framer Motion, glassmorphism floating badges, and reactive state pills.
- **Top-Anchored Sticky Pills & Bottom Mobile Tab Bar**: Top-anchored sticky navigation pills for quick access to Overview, Places & Map, Daily Itinerary, Activities, Cuisines, and Packing List. Dedicated mobile bottom navigation bar for small screens.
- **Streaming Section-by-Section Skeletons**: Real-time optimistic UI rendering where each section streams in as its background generation job completes, with a live progress indicator.

---

## 🚀 Key Features
1. **AI Multi-Batch Generation with Retries**:
   - Atomic `plan.createPlan` mutation validates credits and rate limits, initializes an empty plan, deducts credit, and schedules 4 background jobs.
   - Exponential backoff retry engine (`convex/retrier.ts`: base 2, 1000ms initial delay, up to 5 attempts) guarantees fault tolerance.
   - Idempotent overwriting ensures jobs can re-run without duplicate content.
2. **"Create Empty Plan" (Manual) Path**:
   - Zero credits spent, instant creation, only cover image scheduled, all sections fully editable.
3. **Comprehensive In-Depth Itinerary & Recommendations**:
   - **Overview & Best Time**: Detailed destination background (50+ words) and optimal seasonal advice.
   - **Google Maps & Top Places**: Interactive marker map with places and real coordinates.
   - **Morning, Afternoon & Evening Itinerary**: Structured daily schedule with validated add/edit/delete day capabilities.
   - **Adventures & Activities**: Local experiences with location markers.
   - **Local Cuisine & Delicacies**: Signature regional foods and dining traditions.
   - **Interactive Packing Checklist**: Check off items as you pack, persisted in local storage.
4. **Group Expense Tracker**:
   - Powered by `@tanstack/react-table` with sorting, search, category filters, and contributor filters.
   - Real-time category budget breakdown for `food`, `commute`, `shopping`, `gifts`, `accommodation`, and `others`.
5. **Collaborator Sharing & Join Flow**:
   - Invite travel companions via email using **Resend** and **React Email**.
   - Cryptographically secure 48-char hex tokens.
   - Recipient verification guarantees only the invited email can claim access.
   - Complete cascading cleanup upon trip deletion.
6. **Community Showcase & Public Publishing**:
   - Toggle trip between Private and Public.
   - Public read-only view (`/plans/[planId]/community-plan`) accessible without login.
   - Paginated community explorer with companion filters (`/community-plans`).
7. **Credit System & Optional Stripe Payments**:
   - 2 complimentary free trial credits for new accounts.
   - Isolated Stripe Checkout integration for purchasing fixed credit packs with idempotent webhook fulfillment.
8. **Feedback Sheet**:
   - Integrated floating feedback sheet writing directly to the `feedback` database.

---

## 🛠️ Tech Stack
- **Framework**: Next.js 14.2.35 (App Router, Server Actions, TypeScript strict)
- **Database & Realtime Engine**: Convex 1.47.0 (mutations, queries, file storage, rate limiting, cron/scheduled jobs)
- **Authentication**: Clerk (JWT Template configured for Convex)
- **AI Models**: Google Gemini via official `@google/genai` SDK (swappable with OpenAI via provider abstraction `lib/ai/provider.ts`)
- **Maps**: Google Maps JavaScript API + Places Autocomplete (`@react-google-maps/api`)
- **Weather**: OpenWeatherMap API (executed via Convex action, API key kept server-side)
- **Cover Images**: Unsplash API (search, download, and store in Convex Storage)
- **Emails**: Resend + React Email (Convex Node action with `"use node"`)
- **Styling**: Tailwind CSS + shadcn/ui + Radix UI + Lucide Icons + Framer Motion
- **Tables & Forms**: `@tanstack/react-table`, `zod`, `react-hook-form`, `date-fns`

---

## 📋 Environment Variables & Setup Guide

Documented in `.env.sample`.

### 1. Variables in `.env.local` (Client & Next.js Server)
```env
# Convex Deployment
CONVEX_DEPLOYMENT=dev:your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment-name.convex.cloud

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_ISSUER_DOMAIN=https://your-subdomain.clerk.accounts.dev

# Public Hosting URL
NEXT_PUBLIC_HOSTING_URL=http://localhost:3000

# Google Maps Platform
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
```

### 2. Variables Set in the Convex Dashboard (Server-Side Secrets)
All server-side Convex functions (actions and background jobs) read secrets from the Convex dashboard:
```env
# AI Provider
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.5-flash
# Optional OpenAI fallback
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Unsplash API
UNSPLASH_ACCESS_KEY=your_unsplash_access_key

# OpenWeatherMap API
OPEN_WEATHER_MAP_API_KEY=your_openweathermap_api_key

# Resend Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Pathfinder AI <onboarding@resend.dev>

# Hosting URL for Invite Links
HOSTING_URL=http://localhost:3000

# Clerk Webhook Secret
CLERK_WEBHOOK_SECRET=whsec_...
CLERK_JWT_ISSUER_DOMAIN=https://your-subdomain.clerk.accounts.dev

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🔑 Step-by-Step API Key & Service Configuration

### Step 1: Convex Setup
1. Run `npx convex dev` to initialize your Convex cloud backend.
2. Open the Convex Dashboard and navigate to **Settings > Environment Variables**.
3. Add the server-side environment variables listed above.

### Step 2: Clerk Authentication & JWT Template
1. Create a Clerk account and application at [clerk.com](https://clerk.com).
2. Go to **JWT Templates** in the Clerk dashboard.
3. Click **New Template**, select **Convex**.
4. Set the template name to `convex` (all lowercase).
5. Copy the **Issuer URL** (e.g. `https://verb-noun-00.clerk.accounts.dev`) and set it as `CLERK_JWT_ISSUER_DOMAIN` in both `.env.local` and Convex Dashboard.

### Step 3: Clerk Webhook (User Sync & Cascade Deletion)
1. In Clerk Dashboard, navigate to **Webhooks** and click **Add Endpoint**.
2. Set Endpoint URL: `https://<your-convex-deployment>.convex.site/clerk-users-webhook`.
3. Subscribe to events: `user.created`, `user.updated`, `user.deleted`.
4. Copy the **Signing Secret** (`whsec_...`) and set it as `CLERK_WEBHOOK_SECRET` in the Convex Dashboard.

### Step 4: Google Maps Platform & Places Autocomplete
1. Open Google Cloud Console > APIs & Services.
2. Enable:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**
3. Create an API Key and restrict it:
   - **Application Restrictions**: HTTP referrers (`http://localhost:3000/*` and your production domain).
   - **API Restrictions**: Restrict key to Maps JavaScript API and Places API.
4. Set as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local`.

### Step 5: Google Gemini AI API
1. Visit Google AI Studio at [aistudio.google.com](https://aistudio.google.com) to generate an API Key.
2. Set `GEMINI_API_KEY` in the Convex Dashboard.
3. Set `AI_PROVIDER=gemini` and `GEMINI_MODEL=gemini-2.5-flash`.

### Step 6: Unsplash API
1. Register a developer application at [unsplash.com/developers](https://unsplash.com/developers).
2. Copy the **Access Key** and set it as `UNSPLASH_ACCESS_KEY` in the Convex Dashboard.

### Step 7: OpenWeatherMap API
1. Create a free account at [openweathermap.org](https://openweathermap.org).
2. Generate an API Key under "Current Weather Data".
3. Set `OPEN_WEATHER_MAP_API_KEY` in the Convex Dashboard.

### Step 8: Resend Email Integration
1. Sign up at [resend.com](https://resend.com) and create an API Key.
2. Verify your sending domain in Resend DNS settings (or use `onboarding@resend.dev` for testing).
3. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in the Convex Dashboard.
*(Note: If omitted, the app automatically runs in simulation mode and generates copyable join links in the UI).*

### Step 9: Stripe Payments (Optional)
1. Sign up at [stripe.com](https://stripe.com).
2. Obtain your Secret Key (`sk_test_...`) and set `STRIPE_SECRET_KEY` in the Convex Dashboard.
3. Configure a webhook in Stripe targeting `https://<your-convex-deployment>.convex.site/stripe` listening to `checkout.session.completed`.
4. Set the webhook signing secret as `STRIPE_WEBHOOK_SECRET` in the Convex Dashboard.
*(Note: If Stripe keys are omitted, the app operates completely with payments disabled and hides the purchase buttons).*

---

## 🏃 Development & Testing

```bash
# Install dependencies
npm install

# Run TypeScript check (zero errors)
npx tsc --noEmit

# Run unit tests
npx tsx lib/ai/buildPrompt.test.ts

# Run acceptance tests
npx tsx test/acceptance.test.ts

# Start local Next.js dev server
npm run dev

# Start Convex background synchronization
npx convex dev
```

---

## 📊 Completed Checklist
See [CHECKLIST.md](./CHECKLIST.md) for full phase-by-phase completion details and acceptance test verification results.
