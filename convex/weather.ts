import { v } from "convex/values";
import { action } from "./_generated/server";

export interface CurrentWeatherData {
  temp: number;
  feels_like: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  cityName: string;
}

/**
 * Server-side Convex action that fetches current weather from OpenWeatherMap.
 * Keeps API key strictly server-side.
 * Returns undefined if key is missing or on error, allowing the client widget
 * to gracefully hide itself.
 */
export const getCurrentWeather = action({
  args: {
    placeName: v.string(),
  },
  handler: async (_ctx, args): Promise<CurrentWeatherData | undefined> => {
    const apiKey = process.env.OPEN_WEATHER_MAP_API_KEY;
    if (!apiKey || apiKey === "placeholder" || apiKey.includes("placeholder")) {
      return undefined;
    }

    try {
      // Extract city part (text before the first comma)
      const cityQuery = args.placeName.split(",")[0].trim() || args.placeName;
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        cityQuery
      )}&units=metric&appid=${apiKey}`;

      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`[Weather] Failed to fetch weather for ${cityQuery}: status ${res.status}`);
        return undefined;
      }

      const data = await res.json();
      return {
        temp: Math.round(data.main.temp),
        feels_like: Math.round(data.main.feels_like),
        description: data.weather?.[0]?.description || "Pleasant conditions",
        icon: data.weather?.[0]?.icon || "02d",
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind?.speed || 0),
        cityName: data.name || cityQuery,
      };
    } catch (err: any) {
      console.warn(`[Weather] Error fetching weather for ${args.placeName}:`, err?.message || err);
      return undefined;
    }
  },
});
