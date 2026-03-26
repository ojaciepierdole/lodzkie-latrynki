'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/Layout/Header';
import { FilterBar, type FilterState } from '@/components/Filters/FilterBar';
import type { Toilet } from '@/lib/types/toilet';

function MapLoader() {
  return (
    <div className="map-container flex items-center justify-center bg-[var(--color-surface)]">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-[3px] border-[var(--color-primary)] border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">
          Szukamy najbliższej przystani...
        </p>
      </div>
    </div>
  );
}

const MapContainer = dynamic(() => import('@/components/Map/MapContainer'), {
  ssr: false,
  loading: () => <MapLoader />,
});

const ToiletCard = dynamic(() => import('@/components/ToiletCard/ToiletCard'), {
  ssr: false,
});

export default function HomePage() {
  const [filters, setFilters] = useState<FilterState>({
    openNow: false,
    free: false,
    accessible: false,
    nearest: false,
  });
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const handleMarkerClick = useCallback((toilet: Toilet) => {
    setSelectedToilet(toilet);
  }, []);

  const handleCloseCard = useCallback(() => {
    setSelectedToilet(null);
  }, []);

  const handleUserLocationFound = useCallback((coords: [number, number]) => {
    setUserLocation(coords);
  }, []);

  return (
    <main className="flex flex-col h-dvh">
      <Header />
      <FilterBar filters={filters} onFilterChange={setFilters} />
      <div className="flex-1 relative">
        <MapContainer
          toilets={[]}
          filters={filters}
          userLocation={userLocation}
          onMarkerClick={handleMarkerClick}
          onUserLocationFound={handleUserLocationFound}
        />
        <ToiletCard
          toilet={selectedToilet}
          userLocation={userLocation}
          onClose={handleCloseCard}
        />
      </div>
    </main>
  );
}
