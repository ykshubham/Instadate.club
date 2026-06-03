// worker/services/places.ts
// Foursquare Places API proxy. The API key lives only in the Worker (secret),
// never the client. Foursquare's legacy v3 API sunset 2026-05-15, so we target
// the new Places API (places-api.foursquare.com, Bearer auth + version header).
//
// Search results carry coordinates inline, so a single search call covers both
// autocomplete and selection — no separate "details" round-trip.

import type { Env } from '../index';
import { getHaversineDistance } from './location';

const DEFAULT_BASE = 'https://places-api.foursquare.com';
const DEFAULT_VERSION = '2025-06-17';

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  locality: string;
  latitude: number | null;
  longitude: number | null;
  distanceMeters: number | null;
}

export interface PlacesSearchInput {
  query: string;
  lat?: number | null;
  lng?: number | null;
  limit?: number;
}

export function isPlacesConfigured(env: Env): boolean {
  return Boolean(env.FOURSQUARE_API_KEY && !env.FOURSQUARE_API_KEY.startsWith('your-'));
}

/**
 * Normalize ONE raw Foursquare result into our flat shape. Pure + defensive:
 * reads both the new API shape (`fsq_place_id`, top-level `latitude`/`longitude`)
 * and the legacy v3 shape (`fsq_id`, `geocodes.main.*`) so a field/taxonomy drift
 * cannot break the feature. `origin` (the searcher's coords) lets us fill in
 * distance when the API didn't return one.
 */
export function normalizeFoursquareResult(
  r: any,
  origin?: { lat: number; lng: number } | null
): PlaceResult | null {
  if (!r || typeof r !== 'object') return null;
  const placeId = r.fsq_place_id ?? r.fsq_id ?? null;
  const name = typeof r.name === 'string' ? r.name : '';
  if (!placeId || !name) return null;

  const loc = r.location || {};
  const address = loc.formatted_address ?? loc.address ?? '';
  const locality = loc.locality ?? loc.region ?? loc.dma ?? '';

  const latitude = numOrNull(r.latitude ?? r.geocodes?.main?.latitude);
  const longitude = numOrNull(r.longitude ?? r.geocodes?.main?.longitude);

  let distanceMeters = numOrNull(r.distance);
  if (distanceMeters === null && origin && latitude !== null && longitude !== null) {
    // Foursquare omits distance when no `ll` was sent; compute it ourselves.
    distanceMeters = Math.round(getHaversineDistance(origin.lat, origin.lng, latitude, longitude) * 1000);
  }

  return { placeId: String(placeId), name, address, locality, latitude, longitude, distanceMeters };
}

function numOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Search Foursquare for venues. Never throws — returns { ok:false, results:[] }
 * on any upstream failure so the caller can degrade to manual entry. Identical
 * searches are cached 5 minutes via the Workers Cache API.
 */
export async function searchPlaces(
  env: Env,
  input: PlacesSearchInput
): Promise<{ ok: boolean; results: PlaceResult[] }> {
  const query = (input.query || '').trim();
  const limit = Math.min(Math.max(input.limit ?? 5, 1), 10);
  const hasOrigin = Number.isFinite(input.lat as number) && Number.isFinite(input.lng as number);
  const origin = hasOrigin ? { lat: Number(input.lat), lng: Number(input.lng) } : null;

  if (!query) return { ok: true, results: [] };

  // --- 5-minute cache (keyed on query + coarse location) ---
  const cacheKey = placesCacheKey(query, origin, limit);
  const edgeCache = getEdgeCache();
  if (edgeCache) {
    try {
      const hit = await edgeCache.match(cacheKey);
      if (hit) {
        const cached = (await hit.json()) as { ok: boolean; results: PlaceResult[] };
        console.info('[places] cache_hit', { query, count: cached.results?.length ?? 0 });
        return cached;
      }
    } catch {
      // Cache lookup failed — proceed to live fetch.
    }
  }

  const base = env.FOURSQUARE_API_BASE || DEFAULT_BASE;
  const version = env.FOURSQUARE_API_VERSION || DEFAULT_VERSION;
  const url = new URL(`${base}/places/search`);
  url.searchParams.set('query', query);
  url.searchParams.set('limit', String(limit));
  if (origin) {
    url.searchParams.set('ll', `${origin.lat},${origin.lng}`);
    url.searchParams.set('radius', '50000'); // 50km bias around the user
  }
  // Optional curated category filter (e.g. cafes/restaurants/bars). Default off so
  // a miscategorized venue is never dropped from autocomplete.
  if (env.FOURSQUARE_CATEGORIES) url.searchParams.set('fsq_category_ids', env.FOURSQUARE_CATEGORIES);
  if (env.FOURSQUARE_FIELDS) url.searchParams.set('fields', env.FOURSQUARE_FIELDS);

  let payload: any;
  try {
    const response = await fetch(url.toString(), {
      headers: {
        authorization: `Bearer ${env.FOURSQUARE_API_KEY}`,
        'X-Places-Api-Version': version,
        accept: 'application/json'
      }
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.warn('[places] upstream_error', { status: response.status, body: body.slice(0, 300) });
      return { ok: false, results: [] };
    }
    payload = await response.json();
  } catch (error) {
    console.warn('[places] fetch_failed', { message: error instanceof Error ? error.message : String(error) });
    return { ok: false, results: [] };
  }

  const rawResults: any[] = Array.isArray(payload?.results) ? payload.results : [];
  const results = rawResults
    .map(r => normalizeFoursquareResult(r, origin))
    .filter((r): r is PlaceResult => r !== null)
    .slice(0, limit);

  console.info('[places] search', { query, count: results.length, hasOrigin });

  const result = { ok: true, results };
  if (edgeCache) {
    try {
      await edgeCache.put(
        cacheKey,
        new Response(JSON.stringify(result), {
          headers: { 'content-type': 'application/json', 'cache-control': 'max-age=300' }
        })
      );
    } catch {
      // Non-fatal: caching is best-effort.
    }
  }
  return result;
}

// `caches.default` is a Workers-only global absent from the DOM CacheStorage type
// (and absent entirely in some test runtimes) — access it defensively.
interface EdgeCache {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}
function getEdgeCache(): EdgeCache | null {
  const store = (globalThis as any).caches;
  return store && typeof store.default?.match === 'function' ? (store.default as EdgeCache) : null;
}

function placesCacheKey(query: string, origin: { lat: number; lng: number } | null, limit: number): Request {
  const ll = origin ? `${origin.lat.toFixed(3)},${origin.lng.toFixed(3)}` : '';
  const key = new URL('https://places.cache/search');
  key.searchParams.set('q', query.toLowerCase());
  key.searchParams.set('ll', ll);
  key.searchParams.set('n', String(limit));
  return new Request(key.toString());
}
