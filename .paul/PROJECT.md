# wcgo.pl — Data Integration & Migration

## What This Is

Integracja danych toalet publicznych z wielu źródeł (scraper UML, gdziejesttron.pl API, crowdsource) do jednej triangulowanej bazy danych. Migracja z pliku seed.json do Supabase PostgreSQL z pełnym modelem danych wzbogaconym o atrybuty z gdziejesttron.pl.

## Core Value

Mieszkańcy aglomeracji łódzkiej mają dostęp do najdokładniejszej, cross-referencyjnej mapy toalet publicznych — wzbogaconej danymi z wielu źródeł.

## Current State

| Attribute | Value |
|-----------|-------|
| Version | 1.1 (pre-migration) |
| Status | MVP |
| Last Updated | 2026-03-27 |

**Production URLs:**
- https://wcgo.pl — Aplikacja mapowa

## Requirements

### Validated (Shipped)
- [x] Mapa toalet z danymi UML (71 lokalizacji) — v1.0
- [x] Filtry (otwarte/darmowe/dostępne/najbliższe) — v1.0
- [x] i18n (5 locali) — v1.0
- [x] Crowdsource "zaproponuj toaletę" — v1.1

### Active (In Progress)
- [ ] Import 233 nowych lokalizacji z gdziejesttron.pl (aglomeracja łódzka)
- [ ] Triangulacja danych (UML + gdziejesttron + community)
- [ ] Migracja z seed.json do Supabase SQL

### Out of Scope
- Import danych spoza aglomeracji łódzkiej — etap późniejszy
- Panel admina do zarządzania danymi — osobny milestone
- Integracja z Google Maps API — koszt, Nominatim wystarcza

## Target Users

**Primary:** Mieszkańcy i turyści w aglomeracji łódzkiej
- Potrzebują toalety publicznej w pobliżu
- Korzystają z telefonu w terenie
- Cenią dokładne informacje (godziny, dostępność, cena)

## Context

**Business Context:**
- gdziejesttron.pl to ogólnopolski serwis z 10k+ lokalizacjami, z czego 245 w aglomeracji łódzkiej
- Nasz scraper UML daje 71 unikatowych punktów (60 nie pokrywa się z gdziejesttron)
- Overlap: tylko 12 lokalizacji — dane są komplementarne, nie duplikujące

**Technical Context:**
- Obecne storage: plik seed.json (flat file, brak relacji)
- Docelowe storage: Supabase PostgreSQL (RLS, realtime, auth)
- gdziejesttron API: `GET /throne/list` — publiczne, bez auth, JSON array
- Nowe atrybuty z gdziejesttron: parameters (Damska/Męska/Przewijak/etc.), openByDays, kind, opinions, images, qty

## Constraints

### Technical Constraints
- Next.js 15 App Router + Vercel deployment
- Supabase free tier (500MB, 50k rows)
- Rate limiting na gdziejesttron: `Crawl-delay: 10` w robots.txt

### Data Quality Constraints
- Adresy w gdziejesttron są UPPERCASE i niekonsystentne ("Łódz" vs "Łódź")
- Bounding box aglomeracji to przybliżenie — edge cases na granicach
- 28% lokalizacji z gdziejesttron ma godziny otwarcia, 52% ma parametry

## Key Decisions

| Decision | Rationale | Date | Status |
|----------|-----------|------|--------|
| Ograniczenie do aglomeracji łódzkiej | Focus na core market, jakość > ilość | 2026-03-27 | Active |
| Supabase jako docelowa baza | Już używany w innych projektach, free tier wystarczy | 2026-03-27 | Active |
| `accessible` mapowane z "Dla osób z niepełnosprawnością" | Istniejące pole w modelu Toilet | 2026-03-27 | Active |

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js 15 | App Router |
| Frontend | React + Leaflet + Tailwind v4 | |
| Database (current) | seed.json | Flat file |
| Database (target) | Supabase PostgreSQL | Free tier |
| Hosting | Vercel | |
| Data Sources | UML scraper, gdziejesttron.pl API, crowdsource | |

## Links

| Resource | URL |
|----------|-----|
| Repository | https://github.com/ojaciepierdole/lodzkie-latrynki |
| Production | https://wcgo.pl |
| gdziejesttron API | https://gdziejesttron.pl/throne/list |
| UML source | https://uml.lodz.pl/dla-mieszkancow/toalety-miejskie/ |

---
*PROJECT.md — Updated when requirements or context change*
*Last updated: 2026-03-27*
