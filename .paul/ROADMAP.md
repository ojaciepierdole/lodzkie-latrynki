# Roadmap: wcgo.pl Data Integration

## Overview

Od flat-file MVP (seed.json, 71 lokalizacji) do pełnej bazy Supabase z triangulowanymi danymi z 3 źródeł i 300+ lokalizacjami w aglomeracji łódzkiej.

## Current Milestone

**v1.2 Data Integration** (v1.2.0)
Status: Not started
Phases: 0 of 3 complete

## Phases

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 1 | Import & Mapping | TBD | Not started | - |
| 2 | Triangulacja | TBD | Not started | - |
| 3 | Migracja Supabase | TBD | Not started | - |

## Phase Details

### Phase 1: Import & Mapping

**Goal:** Import 233 lokalizacji z gdziejesttron.pl do seed.json z pełnym mapowaniem atrybutów na model Toilet
**Depends on:** Nothing (first phase)
**Research:** Unlikely (API already explored)

**Scope:**
- Rozszerzenie modelu Toilet o nowe pola (parameters/features, kind/category, qty, images, opinions)
- Mapowanie atrybutów gdziejesttron → Toilet (normalizacja adresów, godzin, parametrów)
- Deduplication z istniejącym seedem (12 overlaps, <100m radius)
- Walidacja i czyszczenie danych (UPPERCASE → title case, "Łódz" → "Łódź")
- Zapis do seed.json z zachowaniem source provenance

### Phase 2: Triangulacja

**Goal:** Cross-referencja danych z UML, gdziejesttron i community — wybór najlepszych wartości per pole
**Depends on:** Phase 1 (merged dataset)
**Research:** Likely (strategia merge'owania conflicting data)

**Scope:**
- Strategia priorytetów źródeł (UML = official, gdziejesttron = crowdsource, community = user reports)
- Merge overlapping records (12 lokalizacji) — wzbogacenie, nie nadpisanie
- Confidence scoring per field
- Raport triangulacji (co się zgadza, co nie, co brakuje)

### Phase 3: Migracja Supabase

**Goal:** Migracja z seed.json do Supabase PostgreSQL z pełnym schematem, RLS i API
**Depends on:** Phase 2 (triangulated dataset)
**Research:** Likely (Supabase schema design, RLS policies, migration strategy)

**Scope:**
- Schema SQL (tabele: toilets, toilet_features, reviews, sources)
- Migration script seed.json → Supabase
- Aktualizacja API routes (/api/toilets) z Supabase client
- RLS policies (public read, authenticated write)
- Aktualizacja frontend do nowego API

---
*Roadmap created: 2026-03-27*
*Last updated: 2026-03-27*
