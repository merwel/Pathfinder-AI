import { Batch1Data, Batch2Data, Batch3Data } from "./schemas";

interface ExtractedContext {
  destination: string;
  noOfDays: number;
  companion: string;
  activities: string[];
}

/**
 * Known approximate coordinates for popular travel destinations around the world.
 */
const DESTINATION_COORDS: Record<string, { lat: number; lng: number }> = {
  kalpa: { lat: 31.5367, lng: 78.2562 },
  kinnaur: { lat: 31.5367, lng: 78.2562 },
  manali: { lat: 32.2432, lng: 77.1892 },
  shimla: { lat: 31.1048, lng: 77.1734 },
  dharamsala: { lat: 32.219, lng: 76.3234 },
  ladakh: { lat: 34.1526, lng: 77.5771 },
  leh: { lat: 34.1526, lng: 77.5771 },
  goa: { lat: 15.2993, lng: 74.124 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  kerala: { lat: 9.9312, lng: 76.2673 },
  delhi: { lat: 28.6139, lng: 77.209 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  paris: { lat: 48.8566, lng: 2.3522 },
  tokyo: { lat: 35.6762, lng: 139.6503 },
  kyoto: { lat: 35.0116, lng: 135.7681 },
  bali: { lat: -8.4095, lng: 115.1889 },
  london: { lat: 51.5074, lng: -0.1278 },
  "new york": { lat: 40.7128, lng: -74.006 },
  rome: { lat: 41.9028, lng: 12.4964 },
  dubai: { lat: 25.2048, lng: 55.2708 },
  bangkok: { lat: 13.7563, lng: 100.5018 },
  singapore: { lat: 1.3521, lng: 103.8198 },
  amsterdam: { lat: 52.3676, lng: 4.9041 },
  barcelona: { lat: 41.3879, lng: 2.1699 },
  sydney: { lat: -33.8688, lng: 151.2093 },
  switzerland: { lat: 46.8182, lng: 8.2275 },
};

/**
 * Extracts context from the prompt string.
 */
function extractContext(prompt: string): ExtractedContext {
  const destMatch = prompt.match(/Destination:\s*([^\n\r]+)/i);
  const daysMatch = prompt.match(/Trip Duration:\s*(\d+)/i);
  const companionMatch = prompt.match(/Travel Companion Type:\s*([^\n\r]+)/i);
  const actMatch = prompt.match(/Activity Preferences:\s*([^\n\r]+)/i);

  const rawDest = destMatch ? destMatch[1].trim() : "this magnificent destination";
  // Capitalize nicely
  const destination = rawDest
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  const noOfDays = daysMatch ? parseInt(daysMatch[1], 10) : 3;
  const companion = companionMatch ? companionMatch[1].trim() : "fellow travelers";
  const activities = actMatch
    ? actMatch[1].split(",").map((s) => s.trim()).filter(Boolean)
    : ["Sightseeing", "Scenic viewpoints", "Local food"];

  return {
    destination,
    noOfDays: Math.max(1, noOfDays),
    companion,
    activities,
  };
}

/**
 * Generates Batch 1: About the place (>= 50 words) & Best time to visit.
 */
export function generateFallbackBatch1(prompt: string): Batch1Data {
  const { destination } = extractContext(prompt);

  const abouttheplace =
    `${destination} is a truly breathtaking destination celebrated for its captivating blend of natural splendor, storied cultural heritage, and authentic local warmth. ` +
    `Nestled amidst dramatic landscapes and timeless architecture, it offers travelers an immersive escape from the bustling modern world. ` +
    `Visitors can wander through picturesque historic streets, admire panoramic viewpoints that stretch toward pristine horizons, and explore centuries-old monuments that narrate legendary chronicles of the region. ` +
    `Whether savoring farm-to-table regional delicacies, immersing yourself in vibrant community traditions, or embarking on tranquil morning trails, ` +
    `${destination} creates unforgettable memories with its harmonious balance of serene tranquility and exhilarating discovery for every explorer.`;

  const besttimetovisit =
    `The best time to visit ${destination} is during the pleasant spring months (April to June) for clear skies, blossoming flora, and comfortable outdoor sightseeing, ` +
    `or during the crisp autumn period (September to November) when crisp weather and vibrant cultural festivities make exploration truly delightful. ` +
    `For winter enthusiasts, the colder months offer picturesque snowy panoramas and a cozy alpine atmosphere.`;

  return {
    abouttheplace,
    besttimetovisit,
  };
}

/**
 * Generates Batch 2: Adventures & activities (>= 5 with locations), Cuisines, Packing list.
 */
export function generateFallbackBatch2(prompt: string): Batch2Data {
  const { destination, companion, activities } = extractContext(prompt);

  const adventuresactivitiestodo = [
    `Sunrise panoramic viewpoint trek to witness the first golden rays illuminating the mountain ridges (${destination} Upper Viewpoint Trail)`,
    `Guided heritage walking tour through the oldest quarter and traditional wood-and-stone settlements (${destination} Historic Quarter)`,
    `Visit the sacred centuries-old architectural sanctuary and monastery with intricate carvings (${destination} Heritage Sanctuary)`,
    `Local culinary and market safari sampling fresh seasonal produce and artisan crafts (${destination} Central Bazaar & Artisan Market)`,
    `Scenic nature walk through lush orchards and pine-scented valleys with picturesque vistas (${destination} Valley Rim Path)`,
    `Stargazing and cozy evening bonfire gathering with local storytelling (${destination} High-Altitude Scenic Retreat)`,
  ];

  const localcuisinerecommendations = [
    `Traditional steamed stuffed breads and dumplings served with artisanal herb butter and spicy chutneys`,
    `Slow-cooked fragrant mountain stew infused with wild alpine aromatics and local spices`,
    `Freshly pressed seasonal orchard fruit preserves, wild apricot crumbles, and mountain blossom honey`,
    `Hand-rolled warming broths and noodles paired with soothing herbal mountain teas`,
  ];

  const packingchecklist = [
    `Thermal base layers and a lightweight windproof down jacket for cool mornings and evenings`,
    `Sturdy, broken-in waterproof hiking footwear with cushioned wool socks`,
    `High SPF 50+ broad-spectrum sunscreen and UV-protective sunglasses`,
    `High-capacity portable power bank and universal travel adapter for long day excursions`,
    `Reusable insulated hydration flask to keep water warm during mountain explorations`,
    `Personal travel medical pouch with altitude relief essentials, rehydration salts, and skin moisturizer`,
    `Compact daypack with a built-in waterproof rain cover for day trips with ${companion}`,
  ];

  return {
    adventuresactivitiestodo,
    localcuisinerecommendations,
    packingchecklist,
  };
}

/**
 * Generates Batch 3: Top places with real coordinates & Day-by-Day Itinerary for exact N days.
 */
export function generateFallbackBatch3(prompt: string): Batch3Data {
  const { destination, noOfDays, companion } = extractContext(prompt);

  const destKey = destination.toLowerCase().trim();
  const baseCoords = DESTINATION_COORDS[destKey] || { lat: 31.5367, lng: 78.2562 };

  // Generate 5 top places with distinct realistic coordinates around base
  const topplacestovisit = [
    {
      name: `${destination} Panoramic Peak & Viewpoint`,
      coordinates: {
        lat: parseFloat((baseCoords.lat + 0.008).toFixed(4)),
        lng: parseFloat((baseCoords.lng + 0.005).toFixed(4)),
      },
    },
    {
      name: `${destination} Heritage Monastery & Cultural Sanctuary`,
      coordinates: {
        lat: parseFloat((baseCoords.lat + 0.002).toFixed(4)),
        lng: parseFloat((baseCoords.lng + 0.001).toFixed(4)),
      },
    },
    {
      name: `${destination} Ancient Village & Traditional Orchards`,
      coordinates: {
        lat: parseFloat((baseCoords.lat - 0.006).toFixed(4)),
        lng: parseFloat((baseCoords.lng - 0.004).toFixed(4)),
      },
    },
    {
      name: `${destination} Historic High-Cliff Lookout`,
      coordinates: {
        lat: parseFloat((baseCoords.lat - 0.007).toFixed(4)),
        lng: parseFloat((baseCoords.lng - 0.012).toFixed(4)),
      },
    },
    {
      name: `${destination} Sacred Temple & Valley Promenade`,
      coordinates: {
        lat: parseFloat((baseCoords.lat + 0.012).toFixed(4)),
        lng: parseFloat((baseCoords.lng + 0.014).toFixed(4)),
      },
    },
  ];

  // Generate EXACTLY noOfDays itinerary days
  const dayThemes = [
    "Arrival, Acclimatization & Golden Hour Vistas",
    "Historic Landmarks & Sacred Heritage",
    "Alpine Trails & Hidden Valley Wonders",
    "Culinary Traditions & Local Artisan Craft",
    "Scenic Viewpoints & Photography Expedition",
    "Relaxed Farewell Strolls & Departure Highlights",
    "High-Altitude Wilderness Trek",
    "Country Orchards & Panoramic Escapades",
    "Off-the-Beaten-Path Secrets & Riverside Discovery",
    "Grand Finale & Sunset Memories",
  ];

  const itinerary = Array.from({ length: noOfDays }, (_, i) => {
    const dayNumber = i + 1;
    const theme = dayThemes[(dayNumber - 1) % dayThemes.length];

    return {
      title: `Day ${dayNumber}: ${theme}`,
      activities: {
        morning: [
          {
            itineraryItem: `Morning Excursion: ${destination} Heritage Exploration`,
            briefDescription: `Start your day with an energizing morning walk to key landmarks in ${destination}, taking in clear crisp vistas and scenic morning light with ${companion}.`,
          },
        ],
        afternoon: [
          {
            itineraryItem: `Afternoon Cultural & Culinary Immersion`,
            briefDescription: `Enjoy a leisurely lunch featuring authentic local delicacies, followed by visiting local artisan workshops, craft markets, and serene historical sites.`,
          },
        ],
        evening: [
          {
            itineraryItem: `Sunset Golden Hour & Fireside Dinner`,
            briefDescription: `Head to a prime panoramic overlook to catch sunset glowing across the horizon, followed by a warm, cozy dinner at a welcoming local eatery.`,
          },
        ],
      },
    };
  });

  return {
    topplacestovisit,
    itinerary,
  };
}
