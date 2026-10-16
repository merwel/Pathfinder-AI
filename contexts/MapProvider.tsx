"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useJsApiLoader, Libraries } from "@react-google-maps/api";

const libraries: Libraries = ["places"];

interface MapContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
  apiKeyAvailable: boolean;
}

const MapContext = createContext<MapContextType>({
  isLoaded: false,
  loadError: undefined,
  apiKeyAvailable: false,
});

export function MapProvider({ children }: { children: ReactNode }) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const apiKeyAvailable = Boolean(
    googleMapsApiKey &&
      googleMapsApiKey.length > 10 &&
      !googleMapsApiKey.toLowerCase().includes("placeholder")
  );

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKeyAvailable ? googleMapsApiKey : "",
    libraries,
    id: "google-map-script",
  });

  return (
    <MapContext.Provider
      value={{
        isLoaded: apiKeyAvailable ? isLoaded : false,
        loadError: apiKeyAvailable ? loadError : undefined,
        apiKeyAvailable,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext() {
  return useContext(MapContext);
}
