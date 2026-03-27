# wcgo.pl — Data Saturation v1.3

## What This Is

Wielofalowy projekt saturacji modelu danych wcgo.pl — od 283 aktywnych toalet z nierównomierną kompletnoścą pól do pełnych, bogatych kart każdej lokalizacji. Wykorzystanie Google Geocoding API, Nominatim, gdziejesttron.pl, i heurystyk do uzupełnienia brakujących danych.

## Core Value

Każda karta toalety w systemie jest kompletna — użytkownik widzi adres, godziny, cenę, dostępność, typ miejsca, opis i zdjęcie, niezależnie od źródła danych.

## Current State

| Attribute | Value |
|-----------|-------|
| Version | 1.2.1 (post-audit) |
| Status | Production |
| Last Updated | 2026-03-27 |

**Production URLs:**
- https://wcgo.pl — Aplikacja mapowa

## Requirements

### Validated (Shipped)
- [x] 284 toalet z 3 źródeł (UML, gdziejesttron, community) — v1.2
- [x] 14 kategorii venue z ikonami — v1.2.1
- [x] Inferowane godziny z kategorii — v1.2.1
- [x] PostGIS, RLS, child tables — v1.2
- [x] Adresy: casing fix + reverse geocoding — v1.2.1

### Active (In Progress)
- [ ] Saturacja danych: % kompletnych kart → 100%
- [ ] Uzupełnienie brakujących godzin otwarcia (76% brak)
- [ ] Uzupełnienie opisów (56% brak)
- [ ] Uzupełnienie zdjęć (97.5% brak)
- [ ] Uzupełnienie features (56% brak)
- [ ] Normalizacja nazw generycznych ("Toaleta" → sensowna nazwa)

### Out of Scope
- Import danych spoza aglomeracji łódzkiej
- Panel admina
- Dark mode

## Target Users

**Primary:** Mieszkańcy i turyści w aglomeracji łódzkiej
- Potrzebują toalety w pobliżu
- Korzystają z telefonu w terenie
- Cenią kompletne informacje (godziny, cena, opis, zdjęcia)

## Context

**Dane wejściowe:**
- Google Geocoding API (klucz skonfigurowany w .env.local)
- Nominatim OSM (free, 1 req/s)
- gdziejesttron.pl API (GET /throne/list, 10321 rekordów)
- Supabase: 284 rekordów, ~24% pól kompletnych

**Kryterium sukcesu:** % kompletnych kart toalet (wszystkie kluczowe pola wypełnione)

## Constraints

### Technical Constraints
- Next.js 15 App Router + Vercel
- Supabase free tier (500MB, 50k rows)
- Nominatim: 1 req/s
- Google Geocoding API: pay-per-use

### Data Quality Rules (CARL domains)
- DATA_IMPORT: 10 reguł (source provenance, bbox, dedup)
- DATA_QUALITY: 9 reguł (casing, coords, hours validation)
- SUPABASE: 9 reguł (schema, RLS, PostGIS, soft delete)

## Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Karty z adresem | 100% | 100% | Achieved |
| Karty z godzinami | 80% | 24% | At risk |
| Karty z opisem | 70% | 44% | At risk |
| Karty z features | 60% | 44% | At risk |
| Karty z category | 100% | 100% | Achieved |
| Karty ze zdjęciem | 30% | 2.5% | Critical |
| Overall completeness | 75% | ~35% | Critical |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 |
| Frontend | React + Leaflet + Tailwind v4 |
| Database | Supabase PostgreSQL + PostGIS |
| Hosting | Vercel |
| APIs | Google Geocoding, Nominatim, gdziejesttron.pl |

## Links

| Resource | URL |
|----------|-----|
| Repository | https://github.com/ojaciepierdole/lodzkie-latrynki |
| Production | https://wcgo.pl |
| gdziejesttron API | https://gdziejesttron.pl/throne/list |
| UML source | https://uml.lodz.pl/dla-mieszkancow/toalety-miejskie/ |

---
*PROJECT.md — Updated 2026-03-27*
