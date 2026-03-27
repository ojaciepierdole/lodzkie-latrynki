# Phase 1: Database Schema & Data Model

## Target Schema (Supabase PostgreSQL + PostGIS)

### Mapowanie atrybutów

```
gdziejesttron.pl          →  DB                          →  TS Interface
─────────────────────────────────────────────────────────────────────────
id (int)                  →  toilet_sources.source_id    →  (internal)
name                      →  toilets.name                →  name
address (UPPERCASE)       →  toilets.address (Title Case)→  address
lat/lng                   →  toilets.location (PostGIS)  →  lat, lng
kind                      →  toilets.category (enum)     →  category
state="accepted"          →  toilets.status="active"     →  status
description               →  toilets.description         →  description
qty                       →  toilets.cabin_count         →  cabinCount
owner                     →  toilets.claimed_by          →  claimedBy
openByDays.{1-7}          →  toilet_hours (per row)      →  hours
parameters[].name         →  toilet_features (enum)      →  features[]
  "Damska"                →  feature='female'
  "Męska"                 →  feature='male'
  "Neutralna"             →  feature='neutral'
  "Przewijak"             →  feature='changing_table'
  "Przyjazna dzieciom"    →  feature='child_friendly'
  "Muszla porcelanowa"    →  feature='porcelain'
  "Dostępne śr. hig."    →  feature='hygiene_supplies'
  "Dla osób z niepełn."   →  toilets.accessible=true     →  accessible
  "Płatna"                →  toilets.type='paid'         →  type
images[]                  →  toilet_images (per row)     →  images[]
opinions[]                →  reviews (per row)           →  reviews[]

UML (seed.json)           →  DB
─────────────────────────────────────────────────────────────────────────
id (MD5 hash)             →  toilet_sources.source_id
source="uml"              →  toilet_sources.source="uml"
type (free/paid)          →  toilets.type
accessible                →  toilets.accessible
hours.{mon-sun}           →  toilet_hours (per row)
hours.raw                 →  toilets.hours_raw (backup)
is24h                     →  toilets.is_24h
```

### kind → category mapping

```
gdziejesttron kind              →  category enum
────────────────────────────────────────────────
toaleta-publiczna               →  public
gastronomia-i-inne-uslugi       →  commercial
kultura                         →  cultural
administracja-publiczna         →  government
```

### openByDays → toilet_hours mapping

```
gdziejesttron key  →  day_of_week (ISO 8601)
──────────────────────────────────────────────
"1"                →  1 (Monday)
"2"                →  2 (Tuesday)
"3"                →  3 (Wednesday)
"4"                →  4 (Thursday)
"5"                →  5 (Friday)
"6"                →  6 (Saturday)
"7"                →  7 (Sunday)

UWAGA: jeśli openByDays ma TYLKO klucz "1" — to znaczy Mon-Sun
(weryfikacja: 100% takich rekordów to stacje benzynowe/sklepy codzienne)
```

---

## SQL Schema

```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enums
CREATE TYPE toilet_source AS ENUM ('uml', 'gdziejesttron', 'community');
CREATE TYPE toilet_category AS ENUM ('public', 'commercial', 'cultural', 'government');
CREATE TYPE toilet_type AS ENUM ('free', 'paid');
CREATE TYPE toilet_status AS ENUM ('active', 'pending', 'closed', 'archived');
CREATE TYPE toilet_feature AS ENUM (
  'female', 'male', 'neutral',
  'changing_table', 'child_friendly',
  'porcelain', 'hygiene_supplies'
);

-- Main table
CREATE TABLE toilets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  address       VARCHAR(500) NOT NULL,
  location      GEOGRAPHY(POINT, 4326) NOT NULL,
  category      toilet_category NOT NULL DEFAULT 'public',
  type          toilet_type NOT NULL DEFAULT 'free',
  price         VARCHAR(50),
  accessible    BOOLEAN NOT NULL DEFAULT false,
  description   TEXT,
  is_24h        BOOLEAN NOT NULL DEFAULT false,
  hours_raw     VARCHAR(255),
  cabin_count   SMALLINT CHECK (cabin_count > 0),
  claimed_by    VARCHAR(255),
  status        toilet_status NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_verified_at TIMESTAMPTZ
);

-- Hours per day (normalized)
CREATE TABLE toilet_hours (
  toilet_id     UUID NOT NULL REFERENCES toilets(id) ON DELETE CASCADE,
  day_of_week   SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  open_time     TIME NOT NULL,
  close_time    TIME NOT NULL,
  PRIMARY KEY (toilet_id, day_of_week)
);

-- Features (many-to-many via enum)
CREATE TABLE toilet_features (
  toilet_id     UUID NOT NULL REFERENCES toilets(id) ON DELETE CASCADE,
  feature       toilet_feature NOT NULL,
  PRIMARY KEY (toilet_id, feature)
);

-- Images
CREATE TABLE toilet_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  toilet_id     UUID NOT NULL REFERENCES toilets(id) ON DELETE CASCADE,
  url           VARCHAR(1000) NOT NULL,
  source        toilet_source NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reviews
CREATE TABLE reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  toilet_id     UUID NOT NULL REFERENCES toilets(id) ON DELETE CASCADE,
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content       TEXT,
  author_name   VARCHAR(255) NOT NULL,
  source        toilet_source NOT NULL,
  source_id     VARCHAR(50),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Source provenance (tracks which sources contributed to each toilet)
CREATE TABLE toilet_sources (
  toilet_id     UUID NOT NULL REFERENCES toilets(id) ON DELETE CASCADE,
  source        toilet_source NOT NULL,
  source_id     VARCHAR(100) NOT NULL,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confidence    DECIMAL(3,2) DEFAULT 1.00 CHECK (confidence BETWEEN 0 AND 1),
  raw_data      JSONB,
  PRIMARY KEY (toilet_id, source)
);

-- Indexes
CREATE INDEX idx_toilets_location ON toilets USING GIST (location);
CREATE INDEX idx_toilets_status ON toilets (status);
CREATE INDEX idx_toilets_category ON toilets (category);
CREATE INDEX idx_toilets_type ON toilets (type);
CREATE INDEX idx_toilet_sources_source ON toilet_sources (source, source_id);
CREATE INDEX idx_reviews_toilet ON reviews (toilet_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER toilets_updated_at
  BEFORE UPDATE ON toilets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE toilets ENABLE ROW LEVEL SECURITY;
ALTER TABLE toilet_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE toilet_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE toilet_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE toilet_sources ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read" ON toilets FOR SELECT USING (true);
CREATE POLICY "Public read" ON toilet_hours FOR SELECT USING (true);
CREATE POLICY "Public read" ON toilet_features FOR SELECT USING (true);
CREATE POLICY "Public read" ON toilet_images FOR SELECT USING (true);
CREATE POLICY "Public read" ON reviews FOR SELECT USING (true);
CREATE POLICY "Public read" ON toilet_sources FOR SELECT USING (true);

-- Authenticated write (crowdsource)
CREATE POLICY "Auth insert" ON toilets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth insert" ON reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Helper: find toilets within radius (meters)
CREATE OR REPLACE FUNCTION nearby_toilets(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_m INTEGER DEFAULT 1000
)
RETURNS SETOF toilets AS $$
  SELECT *
  FROM toilets
  WHERE status = 'active'
    AND ST_DWithin(
      location,
      ST_MakePoint(user_lng, user_lat)::geography,
      radius_m
    )
  ORDER BY location <-> ST_MakePoint(user_lng, user_lat)::geography;
$$ LANGUAGE sql STABLE;
```

---

## Widok helper (backward compatibility z seed.json shape)

```sql
CREATE VIEW toilets_v1 AS
SELECT
  t.id,
  ts.source_id AS legacy_id,
  ts.source,
  t.name,
  t.address,
  ST_Y(t.location::geometry) AS lat,
  ST_X(t.location::geometry) AS lng,
  t.category,
  t.type,
  t.price,
  t.accessible,
  t.description,
  t.is_24h,
  t.hours_raw,
  t.cabin_count,
  t.status,
  t.created_at,
  t.updated_at,
  t.last_verified_at,
  COALESCE(
    (SELECT jsonb_agg(f.feature) FROM toilet_features f WHERE f.toilet_id = t.id),
    '[]'::jsonb
  ) AS features,
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'day', h.day_of_week, 'open', h.open_time::text, 'close', h.close_time::text
    )) FROM toilet_hours h WHERE h.toilet_id = t.id),
    '[]'::jsonb
  ) AS hours
FROM toilets t
LEFT JOIN toilet_sources ts ON ts.toilet_id = t.id
  AND ts.source = (
    SELECT source FROM toilet_sources
    WHERE toilet_id = t.id
    ORDER BY confidence DESC, last_synced_at DESC
    LIMIT 1
  );
```
