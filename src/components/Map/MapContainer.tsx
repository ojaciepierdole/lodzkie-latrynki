'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer as LeafletMap, TileLayer, Marker, ZoomControl, useMap } from 'react-leaflet';
import dynamic from 'next/dynamic';

const MarkerClusterGroup = dynamic(
  () => import('react-leaflet-cluster').then((mod) => mod.default),
  { ssr: false }
);
import { useEffect, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import type { Toilet } from '@/lib/types/toilet';
import type { FilterState } from '@/components/Filters/FilterBar';
import { isOpenNow } from '@/lib/utils/open-hours';
import { haversineDistance } from '@/lib/utils/distance';

// --- Custom SVG Marker Icons ---

const TOILET_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 12h10a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4v-1a2 2 0 0 1 2-2z"/><path d="M7 12V8a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v4"/><path d="M12 19v2"/></svg>`;

function createMarkerIcon(type: 'free' | 'paid' | 'closed'): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-icon ${type}">${TOILET_SVG}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

const freeIcon = createMarkerIcon('free');
const paidIcon = createMarkerIcon('paid');
const closedIcon = createMarkerIcon('closed');

const userIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#EA580C;border-radius:50%;width:14px;height:14px;border:3px solid white;box-shadow:0 0 0 2px #EA580C" class="location-pulse"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// --- User Location Sub-component ---

function UserLocationMarker({ onLocationFound }: { onLocationFound: (coords: [number, number]) => void }) {
  const map = useMap();
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    map.locate({ setView: true, maxZoom: 15 });
    map.on('locationfound', (e) => {
      const coords: [number, number] = [e.latlng.lat, e.latlng.lng];
      setPosition(coords);
      onLocationFound(coords);
    });
  }, [map, onLocationFound]);

  if (!position) return null;
  return <Marker position={position} icon={userIcon} />;
}

// --- Props Interface ---

interface MapContainerProps {
  toilets: Toilet[];
  filters: FilterState;
  userLocation: [number, number] | null;
  selectedToilet: Toilet | null;
  onMarkerClick: (toilet: Toilet) => void;
  onUserLocationFound: (coords: [number, number]) => void;
  onMapMove: (center: [number, number]) => void;
}

// --- Fly to selected toilet ---

function FlyToToilet({ toilet }: { toilet: Toilet | null }) {
  const map = useMap();
  useEffect(() => {
    if (toilet && toilet.lat !== 0 && toilet.lng !== 0) {
      map.flyTo([toilet.lat, toilet.lng], 16, { duration: 1 });
    }
  }, [map, toilet]);
  return null;
}

function MapCenterTracker({ onMove }: { onMove: (center: [number, number]) => void }) {
  const map = useMap();
  useEffect(() => {
    const handler = () => {
      const c = map.getCenter();
      onMove([c.lat, c.lng]);
    };
    map.on('moveend', handler);
    return () => { map.off('moveend', handler); };
  }, [map, onMove]);
  return null;
}

// --- Map Component ---

const LODZ_CENTER: [number, number] = [51.7592, 19.456];

function getMarkerIcon(toilet: Toilet): L.DivIcon {
  if (toilet.status !== 'active') return closedIcon;
  return toilet.type === 'free' ? freeIcon : paidIcon;
}

export default function MapContainerComponent({
  toilets,
  filters,
  userLocation,
  selectedToilet,
  onMarkerClick,
  onUserLocationFound,
  onMapMove,
}: MapContainerProps) {
  const [allToilets, setAllToilets] = useState<Toilet[]>([]);

  // Fetch real data from API on mount
  useEffect(() => {
    fetch('/api/toilets')
      .then((r) => r.json())
      .then((data) => {
        if (data.data && data.data.length > 0) {
          setAllToilets(data.data);
        }
      })
      .catch(() => {
        // Keep empty — no fallback seed data needed anymore
      });
  }, []);

  // Keep in sync when parent passes new toilets
  useEffect(() => {
    if (toilets.length > 0) {
      setAllToilets(toilets);
    }
  }, [toilets]);

  const filteredToilets = useMemo(() => {
    return allToilets
      .filter((t) => t.lat !== 0 && t.lng !== 0)
      .filter((t) => t.status === 'active')
      .filter((t) => {
        if (filters.free && t.type !== 'free') return false;
        if (filters.accessible && !t.accessible) return false;
        if (filters.openNow) {
          const open = isOpenNow(t.hours);
          if (open === false || (open === null && !t.is24h)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (filters.nearest && userLocation) {
          const distA = haversineDistance(userLocation[0], userLocation[1], a.lat, a.lng);
          const distB = haversineDistance(userLocation[0], userLocation[1], b.lat, b.lng);
          return distA - distB;
        }
        return 0;
      });
  }, [allToilets, filters, userLocation]);

  const handleLocationFound = useCallback(
    (coords: [number, number]) => {
      onUserLocationFound(coords);
    },
    [onUserLocationFound],
  );

  return (
    <LeafletMap
      center={LODZ_CENTER}
      zoom={13}
      className="map-container"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />
      <UserLocationMarker onLocationFound={handleLocationFound} />
      <FlyToToilet toilet={selectedToilet} />
      <MapCenterTracker onMove={onMapMove} />
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={50}
        spiderfyOnMaxZoom
        iconCreateFunction={(cluster: L.MarkerCluster) => {
          const count = cluster.getChildCount();
          const size = count < 10 ? 'small' : count < 25 ? 'medium' : 'large';
          const sizeMap = { small: 36, medium: 44, large: 52 } as const;
          const px = sizeMap[size];
          return L.divIcon({
            html: `<div style="
              background: var(--color-primary, #9A3412);
              color: white;
              border-radius: 50%;
              width: ${px}px;
              height: ${px}px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: ${size === 'large' ? 16 : 14}px;
              font-weight: 700;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
              font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
            ">${count}</div>`,
            className: 'custom-marker',
            iconSize: L.point(px, px),
          });
        }}
      >
        {filteredToilets.map((toilet) => (
          <Marker
            key={toilet.id}
            position={[toilet.lat, toilet.lng]}
            icon={getMarkerIcon(toilet)}
            eventHandlers={{ click: () => onMarkerClick(toilet) }}
          />
        ))}
      </MarkerClusterGroup>
    </LeafletMap>
  );
}
