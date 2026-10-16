export const COMPANION_TYPES = [
  { id: "solo", label: "Solo Traveler", description: "Exploring at your own rhythm", icon: "User" },
  { id: "partner", label: "Partner / Couple", description: "Romantic getaways and shared memories", icon: "Heart" },
  { id: "friends", label: "Friends Group", description: "High energy adventures and group fun", icon: "Users" },
  { id: "family", label: "Family with Kids", description: "Kid-friendly, safe, and balanced pacing", icon: "Home" },
  { id: "work", label: "Co-workers / Business", description: "Blend of productivity and networking", icon: "Briefcase" },
] as const;

export const ACTIVITY_PREFERENCES = [
  { id: "sightseeing", label: "Historic Landmarks & Culture" },
  { id: "culinary", label: "Foodie & Fine Dining" },
  { id: "outdoor", label: "Hiking & Nature" },
  { id: "beach", label: "Beaches & Relaxation" },
  { id: "art", label: "Museums & Galleries" },
  { id: "nightlife", label: "Nightlife & Entertainment" },
  { id: "shopping", label: "Markets & Boutique Shopping" },
  { id: "wellness", label: "Spa, Yoga & Wellness" },
  { id: "photography", label: "Scenic Viewpoints & Photo Spots" },
  { id: "local-gems", label: "Hidden Gems & Off-the-Beaten-Path" },
] as const;

export const CREDIT_PACK = {
  id: "standard_pack_10",
  name: "Pathfinder Pack",
  description: "10 AI Trip Generation Credits",
  credits: 10,
  priceInCents: 999, // $9.99
  currency: "usd",
  displayPrice: "$9.99",
  features: [
    "10 Full AI Trip Generations",
    "Comprehensive multi-day itineraries",
    "Interactive Google Maps & weather integration",
    "Live collaborator invites & expense sharing",
    "Export and publish to community gallery",
    "Credits never expire",
  ],
} as const;

export const EXPENSE_CATEGORIES = [
  { id: "food", label: "Food & Dining", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" },
  { id: "commute", label: "Commute & Flights", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" },
  { id: "shopping", label: "Shopping", color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40" },
  { id: "gifts", label: "Gifts & Souvenirs", color: "text-pink-600 bg-pink-50 dark:bg-pink-950/40" },
  { id: "accommodation", label: "Accommodation", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
  { id: "others", label: "Others", color: "text-stone-600 bg-stone-100 dark:bg-stone-800" },
] as const;
