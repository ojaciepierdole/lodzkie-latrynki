# CLAUDE.md — Łódzkie Latrynki

## Overview

Interaktywna mapa toalet publicznych w Łodzi. Webapp parsujący dane z rejestru UML (Urząd Miasta Łodzi), geocodujący adresy i wyświetlający je na mapie Leaflet z filtrami, i18n i geolokalizacją.

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
│   │   └── page.tsx      # Strona główna (mapa + filtry)
│   └── api/
│       ├── scrape/       # POST/GET — cron scraper UML
│       ├── toilets/      # GET — lista toalet (JSON)
│       └── suggest/      # POST — crowdsource (v1.1)
├── components/
│   ├── Map/              # MapContainer (Leaflet, client-only)
│   ├── Filters/          # FilterBar (chipy: otwarte/darmowe/dostępne)
│   └── Layout/           # Header, LanguageSwitcher
├── lib/
│   ├── scraper/          # uml-parser.ts, geocoder.ts
│   ├── utils/            # open-hours.ts, distance.ts
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
4. **Storage** → TODO: Vercel Blob (`toilets.json`); aktualnie seed data w MapContainer
5. **Frontend** → `GET /api/toilets` → Leaflet markers z popup

## Current State (MVP in progress)

**Done:**
- Typy danych (Toilet, OpeningHours, CommunitySubmission)
- i18n setup (5 locali, tłumaczenia pl/en/de/es/uk)
- Leaflet mapa z seed data (4 toalety)
- Header + LanguageSwitcher (dropdown z flagami)
- FilterBar (chipy UI — filtrowanie jeszcze nie połączone z mapą)
- UML scraper (cheerio parser + paginacja)
- Geocoder (Nominatim + batch + cache in-memory)
- API routes: /api/scrape, /api/toilets, /api/suggest
- Utility: isOpenNow(), haversineDistance(), formatDistance()

**TODO:**
- Podłączenie filtrów do MapContainer (state sharing)
- Vercel Blob integration (zapis/odczyt toilets.json)
- Marker clustering (MarkerClusterGroup)
- ToiletCard component (bottom sheet mobile / side panel desktop)
- "Znajdź najbliższą" button (sortowanie po odległości)
- PWA manifest + service worker
- Seed data z prawdziwego scrape'a
- Formularz /suggest (crowdsource UI — v1.1)

## Design Conventions

- **Mobile-first**, responsywny (320px+)
- **Light/dark mode** via `prefers-color-scheme` + CSS custom properties
- Kolory: primary `#1e40af`, accent/free `#059669`, paid `#2563eb`
- Markery mapy: zielone (darmowe), niebieskie (płatne), emoji 🚽
- System font stack (system-ui)
- Tailwind utility classes, brak zewnętrznego design system

## Environment Variables

```env
CRON_SECRET=           # Zabezpieczenie /api/scrape
BLOB_READ_WRITE_TOKEN= # Vercel Blob (auto na Vercel)
GOOGLE_GEOCODING_API_KEY= # Opcjonalny fallback geocoding
NEXT_PUBLIC_APP_URL=https://lodzkie-latrynki.vercel.app
```

## UML Scraper Notes

- Źródło: `https://uml.lodz.pl/dla-mieszkancow/toalety-miejskie/`
- Format: TYPO3 register, paginacja via `tx_edgeregisters_showregister[currentPage]`
- Klasy CSS: `[class*="register"]`, accordion articles, dt/dd pairs
- ~50 toalet, paginacja po ~20
- User-Agent: `LodzkieLatrynki/1.0`
- Rate limiting: 1s między stronami + 1.1s między geocode requests

## Spec Documents

- `BRD.md` — Business Requirements Document
- `SPEC.md` — Technical Specification
