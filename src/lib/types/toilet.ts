export type ToiletCategory = 'public' | 'commercial' | 'cultural' | 'government';

export type ToiletFeature =
  | 'female'
  | 'male'
  | 'neutral'
  | 'changing_table'
  | 'child_friendly'
  | 'porcelain'
  | 'hygiene_supplies';

export interface Toilet {
  id: string;
  source: 'uml' | 'gdziejesttron' | 'community';

  // Location
  name: string;
  address: string;
  lat: number;
  lng: number;

  // Details
  type: 'free' | 'paid';
  price?: string;
  accessible: boolean;
  description?: string;
  category: ToiletCategory;
  features: ToiletFeature[];
  images: string[];
  cabinCount?: number;
  claimedBy?: string;

  // Hours
  hours: OpeningHours;
  is24h: boolean;

  // Meta
  lastScraped: string;
  lastVerified?: string;
  status: 'active' | 'pending' | 'closed';
}

export interface OpeningHours {
  mon?: DayHours;
  tue?: DayHours;
  wed?: DayHours;
  thu?: DayHours;
  fri?: DayHours;
  sat?: DayHours;
  sun?: DayHours;
  raw: string;
}

export interface DayHours {
  open: string;
  close: string;
}

export interface CommunitySubmission {
  id: string;
  toilet: Partial<Toilet>;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  moderatorNote?: string;
}

export interface Review {
  id: string;
  toiletId: string;
  rating: number;
  text?: string;
  photoUrl?: string;
  authorName: string;
  createdAt: string;
  isMock: boolean;
  source: 'gdziejesttron' | 'community';
  sourceId?: string;
}

export interface ToiletSource {
  toiletId: string;
  source: Toilet['source'];
  sourceId: string;
  lastSyncedAt: string;
  confidence: number;
  rawData?: Record<string, unknown>;
}

export interface ToiletsResponse {
  data: Toilet[];
  meta: {
    total: number;
    lastUpdated: string;
    sources: { uml: number; gdziejesttron: number; community: number };
  };
}
