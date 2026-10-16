"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Compass, ExternalLink, Maximize2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlaceItem {
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface InteractiveLeafletMapProps {
  places: PlaceItem[];
  destinationName: string;
}

export function InteractiveLeafletMap({
  places,
  destinationName,
}: InteractiveLeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceItem | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy prior map instance if it exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Compute center
    const validPlaces = places.filter(
      (p) =>
        typeof p.coordinates?.lat === "number" &&
        typeof p.coordinates?.lng === "number" &&
        !isNaN(p.coordinates.lat) &&
        !isNaN(p.coordinates.lng)
    );

    const defaultLat = validPlaces.length > 0 ? validPlaces[0].coordinates.lat : 31.5367;
    const defaultLng = validPlaces.length > 0 ? validPlaces[0].coordinates.lng : 78.2562;

    const centerLat =
      validPlaces.length > 0
        ? validPlaces.reduce((sum, p) => sum + p.coordinates.lat, 0) / validPlaces.length
        : defaultLat;
    const centerLng =
      validPlaces.length > 0
        ? validPlaces.reduce((sum, p) => sum + p.coordinates.lng, 0) / validPlaces.length
        : defaultLng;

    // Initialize Leaflet map
    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    });

    // Add OpenStreetMap Humanitarian (HOT) tiles - high contrast, beautiful terrain & landmarks, 100% keyless
    L.tileLayer(
      "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors, Tiles by <a href="https://www.hotosm.org/" target="_blank">HOT</a>',
        subdomains: ["a", "b", "c"],
        maxZoom: 19,
      }
    ).addTo(map);

    // Custom terracotta map marker pin
    const createMarkerIcon = (index: number) =>
      L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div style="
            position: relative;
            width: 34px;
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35));
          ">
            <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 0C7.61116 0 0 7.61116 0 17C0 27.5 14.5 40.5 16.14 41.94C16.63 42.37 17.37 42.37 17.86 41.94C19.5 40.5 34 27.5 34 17C34 7.61116 26.3888 0 17 0Z" fill="#e05638"/>
              <circle cx="17" cy="17" r="11" fill="white"/>
              <text x="17" y="21" font-size="11" font-weight="bold" font-family="sans-serif" text-anchor="middle" fill="#e05638">${
                index + 1
              }</text>
            </svg>
          </div>
        `,
        iconSize: [34, 42],
        iconAnchor: [17, 42],
        popupAnchor: [0, -42],
      });

    // Add markers for all places
    const bounds = L.latLngBounds([]);

    validPlaces.forEach((place, idx) => {
      const latLng = L.latLng(place.coordinates.lat, place.coordinates.lng);
      bounds.extend(latLng);

      const marker = L.marker(latLng, {
        icon: createMarkerIcon(idx),
        title: place.name,
      }).addTo(map);

      // Popup HTML content
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        place.name + " " + destinationName
      )}`;

      const popupContent = document.createElement("div");
      popupContent.style.padding = "4px";
      popupContent.style.fontFamily = "inherit";
      popupContent.innerHTML = `
        <div style="font-weight: 700; font-size: 13px; color: #1c1917; margin-bottom: 2px;">
          ${idx + 1}. ${place.name}
        </div>
        <div style="font-size: 11px; color: #78716c; font-family: monospace; margin-bottom: 8px;">
          ${place.coordinates.lat.toFixed(4)}, ${place.coordinates.lng.toFixed(4)}
        </div>
        <a 
          href="${googleMapsUrl}" 
          target="_blank" 
          rel="noopener noreferrer" 
          style="
            display: inline-flex; 
            align-items: center; 
            gap: 4px; 
            font-size: 11px; 
            font-weight: 600; 
            color: #e05638; 
            text-decoration: none;
          "
        >
          View in Google Maps &rarr;
        </a>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 240,
        className: "custom-leaflet-popup",
      });

      marker.on("click", () => {
        setSelectedPlace(place);
      });
    });

    // Fit bounds if multiple places exist
    if (validPlaces.length > 1) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }

    mapInstanceRef.current = map;

    // Cleanup
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [places, destinationName]);

  const handleResetView = () => {
    if (!mapInstanceRef.current || places.length === 0) return;
    const bounds = L.latLngBounds(
      places.map((p) => [p.coordinates.lat, p.coordinates.lng])
    );
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  };

  return (
    <div className="relative w-full h-[380px] sm:h-[450px] rounded-3xl overflow-hidden border border-border/80 shadow-md bg-muted/20">
      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Header Floating Overlay Badge */}
      <div className="absolute top-4 left-4 z-[400] flex items-center gap-2 rounded-2xl bg-background/90 backdrop-blur-md px-3.5 py-1.5 shadow-md border border-border/60 text-xs font-medium text-foreground">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        <span>{destinationName} &bull; {places.length} Locations</span>
      </div>

      {/* Floating Map Actions */}
      <div className="absolute top-4 right-4 z-[400] flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="h-8 rounded-xl px-2.5 text-xs gap-1.5 bg-background/90 backdrop-blur-md shadow-md border border-border/60 hover:bg-background"
          onClick={handleResetView}
          title="Reset Map Bounds"
        >
          <Compass className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline">Fit All Places</span>
        </Button>
      </div>

      {/* Map Footer helper badge */}
      <div className="absolute bottom-3 left-3 z-[400] hidden sm:flex items-center gap-1.5 text-[10px] bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-muted-foreground border border-border/40">
        <span>Click any pin to inspect details or open directions</span>
      </div>
    </div>
  );
}
