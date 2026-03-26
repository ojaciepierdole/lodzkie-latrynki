'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/Layout/Header';
import { FilterBar, type FilterState } from '@/components/Filters/FilterBar';
import type { Toilet, Review, ToiletsResponse } from '@/lib/types/toilet';
import { haversineDistance } from '@/lib/utils/distance';

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

const FindNearestFAB = dynamic(() => import('@/components/Map/FindNearestFAB'), {
  ssr: false,
});

const ReviewForm = dynamic(() => import('@/components/ToiletCard/ReviewForm'), {
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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    import('@/lib/data/mock-reviews.json').then((mod) => {
      setReviews(mod.default as Review[]);
    });
  }, []);

  const handleMarkerClick = useCallback((toilet: Toilet) => {
    setIsReviewFormOpen(false);
    setSelectedToilet(toilet);
  }, []);

  const handleCloseCard = useCallback(() => {
    setIsReviewFormOpen(false);
    setSelectedToilet(null);
  }, []);

  const handleUserLocationFound = useCallback((coords: [number, number]) => {
    setUserLocation(coords);
  }, []);

  const handleFindNearest = useCallback(() => {
    setIsLocating(true);

    if (!navigator.geolocation) {
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(coords);

        // Fetch toilets and find nearest
        try {
          const res = await fetch('/api/toilets');
          const data: ToiletsResponse = await res.json();
          const active = data.data.filter(t => t.status === 'active' && t.lat !== 0);

          if (active.length > 0) {
            const nearest = active.reduce((best, t) => {
              const dist = haversineDistance(coords[0], coords[1], t.lat, t.lng);
              const bestDist = haversineDistance(coords[0], coords[1], best.lat, best.lng);
              return dist < bestDist ? t : best;
            });
            setSelectedToilet(nearest);
          }
        } catch {
          // Fallback: just set location, no auto-open
        }

        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleOpenReviewForm = useCallback(() => {
    setIsReviewFormOpen(true);
  }, []);

  const handleCloseReviewForm = useCallback(() => {
    setIsReviewFormOpen(false);
  }, []);

  const handleSubmitReview = useCallback((review: { rating: number; text: string }) => {
    if (!selectedToilet) return;

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      toiletId: selectedToilet.id,
      rating: review.rating,
      text: review.text || undefined,
      authorName: 'Anonim',
      createdAt: new Date().toISOString(),
      isMock: false,
    };

    setReviews(prev => [newReview, ...prev]);
  }, [selectedToilet]);

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
        <FindNearestFAB
          onFindNearest={handleFindNearest}
          isLocating={isLocating}
        />
        <ToiletCard
          toilet={selectedToilet}
          userLocation={userLocation}
          reviews={reviews}
          onClose={handleCloseCard}
          onOpenReviewForm={handleOpenReviewForm}
        />
        {selectedToilet && (
          <ReviewForm
            toiletId={selectedToilet.id}
            toiletName={selectedToilet.name}
            isOpen={isReviewFormOpen}
            onClose={handleCloseReviewForm}
            onSubmit={handleSubmitReview}
          />
        )}
      </div>
    </main>
  );
}
