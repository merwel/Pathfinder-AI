"use client";

import React, { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Cloud, Droplets, Wind, Thermometer } from "lucide-react";

interface WeatherWidgetProps {
  placeName: string;
}

export function WeatherWidget({ placeName }: WeatherWidgetProps) {
  const getWeather = useAction(api.weather.getCurrentWeather);
  const [weather, setWeather] = useState<any>(null);
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchWeather() {
      try {
        const data = await getWeather({ placeName });
        if (isMounted) {
          setWeather(data);
          setHasAttempted(true);
        }
      } catch (err) {
        if (isMounted) {
          setWeather(null);
          setHasAttempted(true);
        }
      }
    }

    if (placeName) {
      fetchWeather();
    }

    return () => {
      isMounted = false;
    };
  }, [placeName, getWeather]);

  // Gracefully hide completely if no key, missing data, or error
  if (!hasAttempted || !weather) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-card/85 backdrop-blur-md border border-border/70 shadow-sm text-xs">
      <div className="flex items-center gap-2">
        {weather.icon ? (
          <img
            src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
            alt={weather.description}
            className="h-7 w-7 object-contain -my-1"
          />
        ) : (
          <Cloud className="h-4 w-4 text-terracotta-500" />
        )}
        <div className="flex items-baseline gap-1">
          <span className="font-serif text-base font-bold text-foreground">
            {weather.temp}°C
          </span>
          <span className="text-[11px] text-muted-foreground capitalize">
            {weather.description}
          </span>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-2.5 border-l border-border/80 pl-2.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1" title="Humidity">
          <Droplets className="h-3 w-3 text-blue-500" />
          {weather.humidity}%
        </span>
        <span className="flex items-center gap-1" title="Wind Speed">
          <Wind className="h-3 w-3 text-teal-500" />
          {weather.windSpeed} m/s
        </span>
      </div>
    </div>
  );
}
