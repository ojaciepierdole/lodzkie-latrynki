# CLAUDE.md — wcgo.pl (dawniej Łódzkie Latrynki)

## Workflow

- **Zawsze kończ sesję commitem i pushem do GitHub** — żadne zmiany nie powinny zostać tylko lokalnie
- Po zakończeniu zadania: `git add` → `git commit` → `git push`

## Overview

Interaktywna mapa toalet publicznych w Łodzi. Webapp parsujący dane z rejestru UML (Urząd Miasta Łodzi), geocodujący adresy i wyświetlający je na mapie Leaflet z filtrami, i18n i geolokalizacją.

**Domena:** wcgo.pl
**Repo:** github.com/ojaciepierdole/lodzkie-latrynki

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS v4
- **Leaflet + react-leaflet** — mapa (dynamic import, no SSR)
- **next-intl** — i18n (5 locali: pl, en, de, es, uk)
- **cheerio** — scraping HTML z uml.lodz.pl
- **Nominatim** (OSM) — geocoding adresów
- **Vercel Blob** — cache wyników scrapera (TODO — jeszcze nie podłączony)
- **Vercel Cron** — codzienny scrape o 00:03 UTC

## Commands

```bash
npm run dev          # Dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint
npm run scrape       # Ręczny scrape (tsx scripts/scrape-manual.ts)
```

## Architecture

```
src/
├── app/
│   ├── [locale]/         # i18n routing (next-intl)
│   │   ├── layout.tsx    # Root layout + i18n provider
│   │   └── page.tsx      # Strona główna (mapa + filtry + state management)
│   └── api/
│       ├── scrape/       # POST/GET — cron scraper UML
│       ├── toilets/      # GET — lista toalet z seed.json
│       └── suggest/      # POST — crowdsource (v1.1)
├── components/
│   ├── Map/
│   │   ├── MapContainer.tsx   # Leaflet mapa + markery + clustering
│   │   └── FindNearestFAB.tsx # Floating action button
│   ├── Filters/          # FilterBar (chipy: otwarte/darmowe/dostępne/najbliższe)
│   ├── Layout/           # Header (logo), LanguageSwitcher
│   ├── ToiletCard/       # Bottom sheet (mobile) / side panel (desktop)
│   │   ├── ToiletCard.tsx
│   │   ├── ReviewForm.tsx
│   │   ├── ReviewList.tsx
│   │   └── StarRating.tsx
│   └── IntroSplash.tsx   # Animacja wejściowa (intro.mp4)
├── lib/
│   ├── scraper/          # uml-parser.ts, geocoder.ts
│   ├── hooks/            # useSwipeDismiss.ts
│   ├── utils/            # open-hours.ts, distance.ts
│   ├── data/             # seed.json, mock-reviews.json
│   └── types/            # toilet.ts (Toilet, OpeningHours, etc.)
├── i18n/                 # config.ts, request.ts, navigation.ts
└── middleware.ts          # next-intl locale routing
```

## Key Data Model

```typescript
interface Toilet {
  id: string;                    // MD5 hash z nazwy
  source: 'uml' | 'community';
  name: string; address: string;
  lat: number; lng: number;
  type: 'free' | 'paid'; price?: string;
  accessible: boolean;
  hours: OpeningHours; is24h: boolean;
  status: 'active' | 'pending' | 'closed';
}
```

## Data Flow

1. **Vercel Cron** → `POST /api/scrape` (chroniony `CRON_SECRET`)
2. **Scraper** → pobiera HTML z `uml.lodz.pl`, parsuje cheerio, paginacja
3. **Geocoder** → Nominatim (1 req/s rate limit), bounding box Łódź
4. **Storage** → TODO: Vercel Blob; aktualnie `src/lib/data/seed.json`
5. **Frontend** → `GET /api/toilets` → MapContainer fetchuje dane w useEffect

## Critical Rules — NIE ŁAMAĆ

### Branding
- Serwis nazywa się **wcgo.pl** (nie "Łódzkie Latrynki")
- Logo: `public/logo.png` — PNG z dużym paddingiem wewnętrznym, wymaga negatywnych marginesów (`-my-4`) żeby wyglądało na odpowiedni rozmiar
- User-Agent w scraperach: `wcgo.pl/1.0 (+https://wcgo.pl)`
- URL produkcyjny: `https://wcgo.pl`

### Header (`Header.tsx`)
- Logo musi mieć duże `h-` (np. `h-20 sm:h-24`) z negatywnymi marginesami, bo PNG ma padding
- **NIGDY nie dawać `overflow-hidden` na `<header>`** — ucina dropdown LanguageSwitcher. Jeśli trzeba, dać overflow-hidden na wewnętrzny div z logo
- LanguageSwitcher dropdown ma `zIndex: 10000` — musi być widoczny nad FilterBar
- Slogan (`tagline`) musi mieć `whitespace-nowrap` — nie może się łamać

### Leaflet / MapContainer
- MapContainer jest `dynamic import` z `ssr: false` — Leaflet nie działa na serwerze
- Sub-komponenty Leaflet (FlyToToilet, UserLocationMarker, MapCenterTracker) używają `useMap()` — muszą być WEWNĄTRZ `<LeafletMap>`
- Mapa auto-centruje się na lokalizacji użytkownika (`map.locate({ setView: true })`)
- `selectedToilet` prop → `FlyToToilet` leci do wybranej toalety
- `onMapMove` prop → `MapCenterTracker` raportuje centrum mapy (fallback dla geolokalizacji)

### Geolokalizacja / "Znajdź najbliższą" (page.tsx)
- **ZAWSZE sprawdzaj `userLocation` PRZED wywołaniem `getCurrentPosition`** — mapa już pobrała lokalizację przez `map.locate()`. Nie pytaj ponownie jeśli już znamy pozycję
- **Fallback na centrum mapy** gdy geolokalizacja nie działa (desktop bez GPS) — nigdy nie pokazuj "nie udało się" jeśli można użyć mapCenter
- `enableHighAccuracy: true` TIMEOUT na desktopie — używaj `false` z `maximumAge: 60000`
- Alert tylko przy `PERMISSION_DENIED`, nie przy timeout/unavailable

### Bottom Sheets / Panele
- ToiletCard: bottom sheet (mobile `<lg`) + side panel (desktop `>=lg`)
- Oba panele zamykane: klik overlay, przycisk X, **swipe-down** (hook `useSwipeDismiss`)
- `useSwipeDismiss` — 80px threshold, respektuje `scrollTop > 0`
- CSS klasy: `.bottom-sheet`, `.bottom-sheet.open`, `.side-panel`, `.side-panel.open`, `.bottom-sheet-overlay`
- z-index: overlay `1000`, sheet `1001`, ReviewForm overlay `1100`, ReviewForm sheet `1101`

### IntroSplash
- Gra `public/intro.mp4` raz (cookie `latrynki-intro-seen`, ważne 1 rok)
- Fallback: jeśli video error → skip do 'done'
- Fazy: video → black → fadein → done
- Żeby przetestować ponownie: usuń cookie `latrynki-intro-seen` w DevTools → Application → Cookies

### Tailwind v4 + Dynamic Imports
- Komponenty w `dynamic()` import nie generują CSS z Tailwind v4 — używaj **inline styles** w FindNearestFAB i podobnych komponentach
- Overlaye (FAB, ToiletCard, ReviewForm) muszą być POZA `<main>` żeby uniknąć stacking context issues

### i18n
- 5 locali: pl, en, de, es, uk
- Pliki tłumaczeń: `messages/{locale}.json`
- Middleware matcher: `['/', '/(pl|en|de|es|uk)/:path*']` — API routes (`/api/*`) NIE są objęte middleware
- Tytuły stron mają format: "wcgo.pl — {opis w danym języku}"

## Design Conventions

- **Mobile-first**, responsywny (320px+)
- **Light/dark mode** via `prefers-color-scheme` + CSS custom properties
- Kolory: primary `#9A3412` (terracotta), CTA `#EA580C` (orange), free `#059669`, paid `#2563eb`
- Markery mapy: zielone (darmowe), niebieskie (płatne), pomarańczowe clustery
- Font: Plus Jakarta Sans (`--font-plus-jakarta`)
- Tailwind utility classes + CSS custom properties, brak zewnętrznego design system

## Environment Variables

```env
CRON_SECRET=           # Zabezpieczenie /api/scrape
BLOB_READ_WRITE_TOKEN= # Vercel Blob (auto na Vercel)
GOOGLE_GEOCODING_API_KEY= # Opcjonalny fallback geocoding
NEXT_PUBLIC_APP_URL=https://wcgo.pl
```

## UML Scraper Notes

- Źródło: `https://uml.lodz.pl/dla-mieszkancow/toalety-miejskie/`
- Format: TYPO3 register, paginacja via `tx_edgeregisters_showregister[currentPage]`
- ~50 toalet, paginacja po ~20
- User-Agent: `wcgo.pl/1.0 (+https://wcgo.pl)`
- Rate limiting: 1s między stronami + 1.1s między geocode requests

## Spec Documents

- `BRD.md` — Business Requirements Document
- `SPEC.md` — Technical Specification
