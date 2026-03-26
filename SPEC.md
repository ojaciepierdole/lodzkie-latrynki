# Technical Specification
# Łódzkie Latrynki — v1.0

**Stack:** Next.js 15 + TypeScript + Tailwind CSS
**Deploy:** Vercel
**Data:** UML Łódź scraper + Vercel KV/Blob
**Map:** Leaflet + OpenStreetMap (darmowe, bez API key)
**i18n:** next-intl (5 locali)

---

## 1. Architektura

```
┌─────────────────────────────────────────────────┐
│                    Vercel                         │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐ │
│  │ Next.js  │  │ Vercel   │  │  Vercel Cron   │ │
│  │ App      │  │ KV/Blob  │  │  (1x/dzień)    │ │
│  │ (SSG+ISR)│  │ (cache)  │  │                │ │
│  └────┬─────┘  └────┬─────┘  └───────┬────────┘ │
│       │              │                │           │
│       │         ┌────┴─────┐   ┌──────┴────────┐│
│       │         │  toilets │   │  UML Scraper   ││
│       │         │  .json   │   │  + Geocoder    ││
│       │         └──────────┘   └───────────────┘ │
└─────────────────────────────────────────────────┘
        │
        ▼
┌──────────────┐    ┌──────────────────────┐
│   Browser    │    │  uml.lodz.pl         │
│   (PWA)      │    │  (HTML scraping)     │
└──────────────┘    └──────────────────────┘
```

### Architektura danych

```
Vercel Cron (00:03 UTC daily)
  → API Route: /api/scrape
    → Fetch HTML z uml.lodz.pl (wszystkie strony paginacji)
    → Parse HTML → Toilet[]
    → Geocode nowych adresów (Nominatim)
    → Zapisz do Vercel Blob: toilets.json
    → Revalidate ISR cache

Next.js App
  → getStaticProps/generateStaticParams
    → Odczyt toilets.json z Blob
    → Render mapy z markerami
```

---

## 2. Struktura projektu

```
lodzkie-latrynki/
├── .env.local                  # zmienne lokalne
├── .env.example                # template
├── next.config.ts              # Next.js config + i18n
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json                 # cron config
├── package.json
│
├── messages/                   # tłumaczenia (next-intl)
│   ├── pl.json
│   ├── en.json
│   ├── de.json
│   ├── es.json
│   └── uk.json
│
├── public/
│   ├── markers/               # ikony pinów na mapie
│   │   ├── toilet-free.svg
│   │   ├── toilet-paid.svg
│   │   └── toilet-accessible.svg
│   ├── manifest.json          # PWA manifest
│   └── favicon.ico
│
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx     # root layout z i18n provider
│   │   │   ├── page.tsx       # strona główna (mapa)
│   │   │   └── suggest/
│   │   │       └── page.tsx   # formularz crowdsource (v1.1)
│   │   ├── api/
│   │   │   ├── scrape/
│   │   │   │   └── route.ts   # cron endpoint: scrape + geocode
│   │   │   ├── toilets/
│   │   │   │   └── route.ts   # GET: lista toalet (JSON)
│   │   │   └── suggest/
│   │   │       └── route.ts   # POST: crowdsource submission (v1.1)
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── Map/
│   │   │   ├── MapContainer.tsx    # dynamiczny import Leaflet (no SSR)
│   │   │   ├── ToiletMarker.tsx    # marker z popup
│   │   │   ├── UserLocation.tsx    # geolokalizacja
│   │   │   └── MarkerCluster.tsx   # klastrowanie pinów
│   │   ├── Filters/
│   │   │   ├── FilterBar.tsx       # pasek filtrów
│   │   │   ├── FilterChip.tsx      # pojedynczy filtr (toggle)
│   │   │   └── OpenNowToggle.tsx   # filtr "otwarte teraz"
│   │   ├── ToiletCard/
│   │   │   ├── ToiletCard.tsx      # karta szczegółów
│   │   │   ├── OpenStatus.tsx      # badge otwarty/zamknięty
│   │   │   └── NavigateButton.tsx  # link do Google/Apple Maps
│   │   ├── Layout/
│   │   │   ├── Header.tsx
│   │   │   ├── LanguageSwitcher.tsx
│   │   │   └── Footer.tsx
│   │   └── ui/                     # shadcn/ui components
│   │
│   ├── lib/
│   │   ├── scraper/
│   │   │   ├── uml-parser.ts       # HTML → Toilet[] parser
│   │   │   ├── geocoder.ts         # adres → [lat, lng]
│   │   │   └── scheduler.ts        # orchestracja scrape
│   │   ├── data/
│   │   │   ├── toilets.ts          # CRUD + cache logic
│   │   │   └── seed.json           # initial data (backup)
│   │   ├── utils/
│   │   │   ├── open-hours.ts       # parsowanie godzin, isOpenNow()
│   │   │   ├── distance.ts         # haversine distance
│   │   │   └── format.ts           # formatowanie danych
│   │   └── types/
│   │       └── toilet.ts           # typy TypeScript
│   │
│   └── i18n/
│       ├── config.ts               # locales, defaultLocale
│       ├── request.ts              # next-intl request config
│       └── navigation.ts           # lokalizowane linki
│
├── scripts/
│   ├── scrape-manual.ts            # ręczny scrape (dev)
│   └── seed-geocode.ts             # jednorazowy geocoding
│
└── docs/
    ├── BRD.md                      # → link do BRD.md w root
    └── ARCHITECTURE.md
```

---

## 3. Modele danych

### Toilet (core)

```typescript
interface Toilet {
  id: string;                    // hash z adresu (deterministyczny)
  source: 'uml' | 'community';  // źródło danych

  // Lokalizacja
  name: string;                  // np. "Park im. marsz. J. Piłsudskiego"
  address: string;               // pełny adres
  lat: number;                   // szerokość geograficzna
  lng: number;                   // długość geograficzna

  // Szczegóły
  type: 'free' | 'paid';
  price?: string;                // np. "2 zł"
  accessible: boolean;           // dostępna dla niepełnosprawnych
  description?: string;          // opis (typ kabin, liczba)

  // Godziny
  hours: OpeningHours;
  is24h: boolean;

  // Meta
  lastScraped: string;           // ISO date
  lastVerified?: string;         // ISO date (crowdsource)
  status: 'active' | 'pending' | 'closed';
}

interface OpeningHours {
  mon?: DayHours;
  tue?: DayHours;
  wed?: DayHours;
  thu?: DayHours;
  fri?: DayHours;
  sat?: DayHours;
  sun?: DayHours;
  raw: string;                   // oryginalny tekst z UML
}

interface DayHours {
  open: string;  // "07:00"
  close: string; // "16:30"
}

interface CommunitySubmission {
  id: string;
  toilet: Partial<Toilet>;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  moderatorNote?: string;
}
```

---

## 4. UML Scraper

### Strategia parsowania

```typescript
// src/lib/scraper/uml-parser.ts

const UML_BASE = 'https://uml.lodz.pl/dla-mieszkancow/toalety-miejskie/';

async function scrapeAllPages(): Promise<RawToilet[]> {
  const toilets: RawToilet[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = page === 1
      ? UML_BASE
      : `${UML_BASE}?tx_edgeregisters_showregister[currentPage]=${page}`;

    const html = await fetch(url).then(r => r.text());
    const parsed = parseToiletsFromHTML(html);

    if (parsed.length === 0) {
      hasMore = false;
    } else {
      toilets.push(...parsed);
      page++;
    }
  }

  return toilets;
}
```

### Parsowanie HTML

Strona UML używa systemu rejestrów TYPO3 z klasami:
- `.js-registers-container` — kontener
- `.js-accordion-article` — pojedynczy wpis
- Pola wewnątrz: Lokalizacja, Opis, Godziny otwarcia, Typ, Dla niepełnosprawnych

Parser powinien użyć `cheerio` do ekstrakcji danych z HTML.

### Geocoding

```typescript
// src/lib/scraper/geocoder.ts

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

async function geocodeAddress(address: string): Promise<[number, number] | null> {
  const query = `${address}, Łódź, Polska`;
  const res = await fetch(
    `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { headers: { 'User-Agent': 'LodzkieLatrynki/1.0' } }
  );

  const data = await res.json();
  if (data[0]) {
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  }
  return null;
}
```

Nominatim rate limit: 1 req/s — geocoding uruchamiany tylko dla nowych/zmienionych adresów.

---

## 5. API Routes

### GET /api/toilets
Zwraca aktualną listę toalet z cache.

```typescript
// Response
{
  data: Toilet[],
  meta: {
    total: number,
    lastUpdated: string,      // ISO date
    sources: { uml: number, community: number }
  }
}
```

### POST /api/scrape
Wywoływany przez Vercel Cron. Wymaga `CRON_SECRET`.

```typescript
// vercel.json
{
  "crons": [{
    "path": "/api/scrape",
    "schedule": "3 0 * * *"   // 00:03 UTC codziennie
  }]
}
```

### POST /api/suggest (v1.1)
Crowdsource submission. Rate limited (5/h per IP).

---

## 6. Internacjonalizacja (i18n)

### Konfiguracja next-intl

```typescript
// src/i18n/config.ts
export const locales = ['pl', 'en', 'de', 'es', 'uk'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pl';

export const localeNames: Record<Locale, string> = {
  pl: 'Polski',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  uk: 'Українська',
};
```

### Struktura tłumaczeń

```json
// messages/pl.json
{
  "meta": {
    "title": "Łódzkie Latrynki — Mapa Toalet Miejskich",
    "description": "Znajdź najbliższą toaletę publiczną w Łodzi"
  },
  "map": {
    "findNearest": "Znajdź najbliższą",
    "myLocation": "Moja lokalizacja",
    "showAll": "Pokaż wszystkie"
  },
  "filters": {
    "free": "Darmowe",
    "paid": "Płatne",
    "accessible": "Dostępne",
    "openNow": "Otwarte teraz",
    "all": "Wszystkie"
  },
  "toilet": {
    "free": "Bezpłatna",
    "paid": "Płatna",
    "price": "Cena: {price}",
    "open": "Otwarte",
    "closed": "Zamknięte",
    "hours": "Godziny: {hours}",
    "accessible": "Dostępna dla niepełnosprawnych",
    "notAccessible": "Niedostępna dla niepełnosprawnych",
    "navigate": "Nawiguj",
    "details": "Szczegóły",
    "source": {
      "uml": "Dane: UML Łódź",
      "community": "Zgłoszone przez społeczność"
    }
  },
  "suggest": {
    "title": "Zgłoś toaletę",
    "address": "Adres",
    "type": "Typ",
    "hours": "Godziny otwarcia",
    "submit": "Wyślij zgłoszenie",
    "success": "Dziękujemy! Zgłoszenie zostanie zweryfikowane.",
    "error": "Wystąpił błąd. Spróbuj ponownie."
  },
  "common": {
    "loading": "Ładowanie...",
    "error": "Coś poszło nie tak",
    "retry": "Spróbuj ponownie",
    "yes": "Tak",
    "no": "Nie"
  }
}
```

### Routing

```
/pl          → polska wersja (domyślna)
/en          → angielska
/de          → niemiecka
/es          → hiszpańska
/uk          → ukraińska
/pl/suggest  → formularz zgłoszenia (v1.1)
```

---

## 7. Frontend — Komponenty

### MapContainer
- Leaflet z OpenStreetMap tiles (darmowe)
- Dynamic import (`next/dynamic`, ssr: false)
- Centered na Łódź: `[51.7592, 19.4560]`, zoom 13
- MarkerClusterGroup dla grupowania

### FilterBar
- Sticky bar pod headerem
- Chipy: Darmowe | Płatne | Dostępne | Otwarte teraz
- Stan filtrów w URL params (linkable)

### ToiletCard
- Bottom sheet na mobile (slide up)
- Side panel na desktop
- Dane: nazwa, adres, godziny, typ, dostępność
- CTA: "Nawiguj" (deep link do Maps)

### LanguageSwitcher
- Dropdown z flagami + nazwą języka
- Zmiana locale bez reloadu strony

---

## 8. Zmienne środowiskowe

```env
# .env.example

# Vercel Cron secret (zabezpieczenie endpointu scrape)
CRON_SECRET=

# Opcjonalnie: Google Maps Geocoding API (fallback jeśli Nominatim zawodzi)
GOOGLE_GEOCODING_API_KEY=

# Vercel Blob token (auto-generowane na Vercel)
BLOB_READ_WRITE_TOKEN=

# Opcjonalnie: Sentry DSN (monitoring błędów)
SENTRY_DSN=

# App URL (dla OG tags, sitemap)
NEXT_PUBLIC_APP_URL=https://lodzkie-latrynki.vercel.app
```

---

## 9. Deployment — Vercel

### Konfiguracja

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/scrape",
      "schedule": "3 0 * * *"
    }
  ],
  "headers": [
    {
      "source": "/api/toilets",
      "headers": [
        { "key": "Cache-Control", "value": "public, s-maxage=3600, stale-while-revalidate=86400" }
      ]
    }
  ]
}
```

### Domain
- Produkcja: `lodzkie-latrynki.vercel.app`
- Custom domain: TBD (np. `latrynki.lodz.pl`)

---

## 10. Performance budget

| Metryka | Target | Strategia |
|---------|--------|-----------|
| FCP | < 1.5s | SSG + edge cache |
| LCP | < 2.5s | lazy load mapy, SSG |
| CLS | < 0.1 | fixed height map container |
| Bundle JS | < 150KB | dynamic import Leaflet |
| Tiles | Lazy | viewport-only loading |
| Data JSON | < 20KB | ~50 toalet, gzipped |

---

## 11. Roadmap techniczny

| Faza | Co | Kiedy |
|------|----|-------|
| 0 | Projekt setup, scraper, seed data | Tydzień 1 |
| 1 | Mapa + filtry + i18n (MVP) | Tydzień 2-3 |
| 2 | UI polish, PWA, SEO | Tydzień 4 |
| 3 | Crowdsourcing + admin | Tydzień 5-6 |
| 4 | QR kody, offline, rozszerzenia | Backlog |
