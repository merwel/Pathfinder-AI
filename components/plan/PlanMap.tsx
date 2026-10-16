"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { GoogleMap, MarkerF, InfoWindowF } from "@react-google-maps/api";
import { MapPin, Navigation, Compass, ExternalLink } from "lucide-react";
import { useMapContext } from "@/contexts/MapProvider";
import { Button } from "@/components/ui/button";

interface PlaceItem {
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface PlanMapProps {
  places: PlaceItem[];
  destinationName: string;
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "1.25rem",
};

// Subtle warm editorial map styles
const customMapStyles = [
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#938174" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#e2e6d5" }],
  },
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [{ color: "#cde3e8" }],
  },
];

const InteractiveLeafletMap = dynamic(
  () =>
    import("./InteractiveLeafletMap").then((mod) => mod.InteractiveLeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[380px] sm:h-[450px] rounded-3xl bg-muted/30 animate-pulse flex items-center justify-center border border-border/80">
        <span className="text-xs text-muted-foreground flex items-center gap-2">
          <Compass className="h-4 w-4 animate-spin text-primary" />
          Loading interactive map...
        </span>
      </div>
    ),
  }
);

export function PlanMap({ places, destinationName }: PlanMapProps) {
  const { isLoaded, apiKeyAvailable, loadError } = useMapContext();
  const [selectedPlace, setSelectedPlace] = useState<PlaceItem | null>(null);

  // Compute map center
  const center = useMemo(() => {
    if (places && places.length > 0) {
      const avgLat = places.reduce((sum, p) => sum + p.coordinates.lat, 0) / places.length;
      const avgLng = places.reduce((sum, p) => sum + p.coordinates.lng, 0) / places.length;
      return { lat: avgLat, lng: avgLng };
    }
    return { lat: 31.5367, lng: 78.2562 };
  }, [places]);

  // If Google Maps API is not configured or failed to load, render our Leaflet interactive map
  if (!apiKeyAvailable || !isLoaded || !!loadError) {
    return <InteractiveLeafletMap places={places} destinationName={destinationName} />;
  }

  return (
    <div className="relative w-full h-[380px] sm:h-[450px] rounded-3xl overflow-hidden border border-border/80 shadow-md">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={12}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          styles: customMapStyles,
        }}
      >
        {places.map((place, idx) => (
          <MarkerF
            key={idx}
            position={{ lat: place.coordinates.lat, lng: place.coordinates.lng }}
            title={place.name}
            onClick={() => setSelectedPlace(place)}
          />
        ))}

        {selectedPlace && (
          <InfoWindowF
            position={{
              lat: selectedPlace.coordinates.lat,
              lng: selectedPlace.coordinates.lng,
            }}
            onCloseClick={() => setSelectedPlace(null)}
          >
            <div className="p-1 max-w-xs text-stone-900">
              <h4 className="font-serif font-bold text-sm mb-1">{selectedPlace.name}</h4>
              <p className="text-[11px] text-stone-600 mb-2">
                Coordinates: {selectedPlace.coordinates.lat.toFixed(4)},{" "}
                {selectedPlace.coordinates.lng.toFixed(4)}
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  selectedPlace.name + " " + destinationName
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-terracotta-600 hover:underline"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>
    </div>
  );
}
