'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { IntroSplash } from '@/components/IntroSplash';
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

const SuggestForm = dynamic(() => import('@/components/SuggestForm'), {
  ssr: false,
});

const CorrectionForm = dynamic(() => import('@/components/ToiletCard/CorrectionForm'), {
  ssr: false,
});

export default function HomePage() {
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    accessible: false,
    openNow: false,
  });
  const [filteredCount, setFilteredCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.7592, 19.456]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSuggestFormOpen, setIsSuggestFormOpen] = useState(false);
  const [isCorrectionFormOpen, setIsCorrectionFormOpen] = useState(false);

  // Fetch reviews from Supabase API
  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data as Review[]);
      }
    } catch {
      // silent — reviews are non-critical
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

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

  const findNearestFromCoords = useCallback(async (coords: [number, number]) => {
    try {
      const res = await fetch('/api/toilets');
      const data: ToiletsResponse = await res.json();
      const active = data.data
        .filter(t => t.status === 'active' && t.lat !== 0)
        .filter(t => {
          if (filters.type === 'free' && t.type !== 'free') return false;
          if (filters.type === 'paid' && t.type !== 'paid') return false;
          if (filters.accessible && !t.accessible) return false;
          return true;
        });

      if (active.length > 0) {
        const nearest = active.reduce((best, t) => {
          const dist = haversineDistance(coords[0], coords[1], t.lat, t.lng);
          const bestDist = haversineDistance(coords[0], coords[1], best.lat, best.lng);
          return dist < bestDist ? t : best;
        });
        setSelectedToilet(nearest);
      }
    } catch {
      // silent
    }
  }, [filters]);

  const handleFindNearest = useCallback(() => {
    setIsLocating(true);

    // If we already have the user's location from the map, use it directly
    if (userLocation) {
      findNearestFromCoords(userLocation).then(() => setIsLocating(false));
      return;
    }

    // Try geolocation, fallback to map center
    if (!navigator.geolocation) {
      findNearestFromCoords(mapCenter).then(() => setIsLocating(false));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(coords);
        await findNearestFromCoords(coords);
        setIsLocating(false);
      },
      async () => {
        // Geolocation failed — use current map center as fallback
        await findNearestFromCoords(mapCenter);
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }, [userLocation, mapCenter, findNearestFromCoords]);

  const handleOpenSuggestForm = useCallback(() => {
    setIsSuggestFormOpen(true);
  }, []);

  const handleCloseSuggestForm = useCallback(() => {
    setIsSuggestFormOpen(false);
  }, []);

  const handleOpenReviewForm = useCallback(() => {
    setIsReviewFormOpen(true);
  }, []);

  const handleCloseReviewForm = useCallback(() => {
    setIsReviewFormOpen(false);
  }, []);

  const handleOpenCorrectionForm = useCallback(() => {
    setIsCorrectionFormOpen(true);
  }, []);

  const handleCloseCorrectionForm = useCallback(() => {
    setIsCorrectionFormOpen(false);
  }, []);

  const handleSubmitReview = useCallback(async (review: { rating: number; text: string }) => {
    if (!selectedToilet) return;

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toiletId: selectedToilet.id,
          rating: review.rating,
          text: review.text || null,
        }),
      });

      if (res.ok) {
        // Re-fetch all reviews to get the server-generated data
        await fetchReviews();
      } else {
        // Optimistic fallback: add locally if API fails
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
      }
    } catch {
      // Optimistic fallback on network error
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
    }
  }, [selectedToilet, fetchReviews]);

  return (
    <IntroSplash>
      <main className="flex flex-col h-dvh">
        <h1 style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', borderWidth: 0 }}>
          wcgo.pl — Mapa toalet publicznych w Łodzi
        </h1>
        <Header />
        <FilterBar filters={filters} onFilterChange={setFilters} filteredCount={filteredCount} totalCount={totalCount} />
        <div className="flex-1 relative" role="application" aria-label="Mapa toalet publicznych w Łodzi">
          <MapContainer
            toilets={[]}
            filters={filters}
            userLocation={userLocation}
            selectedToilet={selectedToilet}
            onMarkerClick={handleMarkerClick}
            onUserLocationFound={handleUserLocationFound}
            onMapMove={setMapCenter}
            onFilteredCountChange={setFilteredCount}
            onTotalCountChange={setTotalCount}
          />
          {filteredCount === 0 && totalCount > 0 && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 500,
              background: 'var(--color-card)',
              borderRadius: 12,
              padding: '20px 24px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
              textAlign: 'center',
              maxWidth: 280,
            }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 8px' }}>
                Żadna toaleta nie spełnia kryteriów
              </p>
              <button
                type="button"
                onClick={() => setFilters({ type: 'all', accessible: false, openNow: false })}
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--color-cta)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 16px',
                }}
              >
                Resetuj filtry
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Fixed overlays — outside main flow to avoid stacking context issues */}
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
        onOpenCorrectionForm={handleOpenCorrectionForm}
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
      {selectedToilet && (
        <CorrectionForm
          toilet={selectedToilet}
          isOpen={isCorrectionFormOpen}
          onClose={handleCloseCorrectionForm}
        />
      )}

      {/* Suggest toilet FAB — small "+" button, bottom-left to avoid Leaflet zoom controls */}
      <button
        type="button"
        onClick={handleOpenSuggestForm}
        aria-label="Zaproponuj toaletę"
        style={{
          position: 'fixed',
          bottom: 'calc(max(24px, env(safe-area-inset-bottom, 0px)) + 60px)',
          left: 16,
          zIndex: 900,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 48,
          height: 48,
          borderRadius: '50%',
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--color-cta)',
          backgroundColor: 'var(--color-card)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          border: '2px solid var(--color-cta)',
          transition: 'all 200ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-cta)';
          e.currentTarget.style.color = 'white';
          e.currentTarget.style.transform = 'scale(1.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-card)';
          e.currentTarget.style.color = 'var(--color-cta)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <Plus size={24} />
      </button>

      <SuggestForm
        isOpen={isSuggestFormOpen}
        onClose={handleCloseSuggestForm}
      />
    </IntroSplash>
  );
}
