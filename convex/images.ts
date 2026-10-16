import { v } from "convex/values";
import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Downloads a curated destination photo from Unsplash based on city name,
 * stores it permanently in Convex storage, and sets imagination=true.
 * If Unsplash API key is missing or search yields 0 results, still sets imagination=true
 * so the skeleton doesn't spin indefinitely.
 */
export const generateAndStore = internalAction({
  args: {
    planId: v.id("plan"),
  },
  handler: async (ctx, args) => {
    // 1. Fetch the plan details
    const planData = await ctx.runQuery(internal.plan.getPlanInternal, {
      planId: args.planId,
    });

    if (!planData || !planData.plan) {
      console.warn(`[Images] Plan ${args.planId} not found, skipping image search.`);
      return;
    }

    // Extract city name (text before the first comma)
    const placeName = planData.plan.nameoftheplace || "travel destination";
    const cityQuery = placeName.split(",")[0].trim() || placeName;

    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!unsplashKey || unsplashKey === "placeholder") {
      console.log(`[Images] UNSPLASH_ACCESS_KEY not configured. Marking imagination=true with fallback.`);
      await ctx.runMutation(internal.images.patchPlanImage, {
        planId: args.planId,
        imageUrl: undefined,
        storageId: null,
      });
      return;
    }

    try {
      const searchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        cityQuery + " landmark travel"
      )}&orientation=landscape&per_page=1`;

      const response = await fetch(searchUrl, {
        headers: {
          Authorization: `Client-ID ${unsplashKey}`,
        },
      });

      if (!response.ok) {
        console.error(`[Images] Unsplash search failed HTTP ${response.status}`);
        await ctx.runMutation(internal.images.patchPlanImage, {
          planId: args.planId,
          imageUrl: undefined,
          storageId: null,
        });
        return;
      }

      const data = await response.json();
      const firstPhoto = data?.results?.[0];

      if (!firstPhoto) {
        console.log(`[Images] No image found on Unsplash for "${cityQuery}". Setting imagination=true.`);
        await ctx.runMutation(internal.images.patchPlanImage, {
          planId: args.planId,
          imageUrl: undefined,
          storageId: null,
        });
        return;
      }

      // Download photo to store in Convex storage
      const downloadUrl = firstPhoto.urls?.regular || firstPhoto.urls?.full;
      const imageFetchResponse = await fetch(downloadUrl);

      if (!imageFetchResponse.ok) {
        console.error(`[Images] Failed to download image from ${downloadUrl}`);
        await ctx.runMutation(internal.images.patchPlanImage, {
          planId: args.planId,
          imageUrl: firstPhoto.urls?.regular, // Fallback directly to Unsplash CDN
          storageId: null,
        });
        return;
      }

      const imageBlob = await imageFetchResponse.blob();
      const storageId = await ctx.storage.store(imageBlob);
      const publicStorageUrl = await ctx.storage.getUrl(storageId);

      await ctx.runMutation(internal.images.patchPlanImage, {
        planId: args.planId,
        imageUrl: publicStorageUrl || firstPhoto.urls?.regular,
        storageId,
      });

      console.log(`[Images] Successfully saved image for ${cityQuery} to storage (${storageId})`);
    } catch (err: any) {
      console.error(`[Images] Error fetching image for ${cityQuery}:`, err?.message || err);
      // Guarantee imagination=true so user is not stuck on skeleton
      await ctx.runMutation(internal.images.patchPlanImage, {
        planId: args.planId,
        imageUrl: undefined,
        storageId: null,
      });
    }
  },
});

/**
 * Patches plan imageUrl, storageId, and marks contentGenerationState.imagination = true.
 */
export const patchPlanImage = internalMutation({
  args: {
    planId: v.id("plan"),
    imageUrl: v.optional(v.string()),
    storageId: v.union(v.id("_storage"), v.null()),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return;

    await ctx.db.patch(args.planId, {
      imageUrl: args.imageUrl,
      storageId: args.storageId,
      contentGenerationState: {
        ...plan.contentGenerationState,
        imagination: true,
      },
    });
  },
});
