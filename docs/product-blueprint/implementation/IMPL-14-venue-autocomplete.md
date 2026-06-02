# STEP 14 — Venue Autocomplete (Foursquare Places)

## Goal
Hosts get live venue suggestions while typing in the plan **Location** field — no Google Maps
billing. The Foursquare key stays server-side; the feature degrades to manual entry when
unconfigured or on API failure, so event creation never breaks.

## Architecture
Worker proxy + custom dropdown (full UI control, key never reaches the client). Foursquare's
legacy v3 sunset 2026-05-15, so we target the **new Places API**
(`https://places-api.foursquare.com/places/search`, `Authorization: Bearer <KEY>`,
`X-Places-Api-Version: 2025-06-17`). Search returns coordinates inline → **one** endpoint covers
both autocomplete and selection (no details round-trip).

## Backend
- `worker/services/places.ts`
  - `isPlacesConfigured(env)` — `Boolean(FOURSQUARE_API_KEY)`.
  - `normalizeFoursquareResult(r, origin?)` — **pure, defensive**: reads new (`fsq_place_id`,
    top-level `latitude/longitude`) **and** legacy (`fsq_id`, `geocodes.main`) shapes; fills
    distance from `origin` via `getHaversineDistance` when the API omits it.
  - `searchPlaces(env, {query,lat,lng,limit})` — builds the request (`ll`+`radius` when coords),
    **5-min cache** via Workers Cache API, normalizes + slices to 5, logs `[places]`, never throws.
- Route `GET /api/places/search?q=&lat=&lng=` (`worker/index.ts`, in the authed section):
  auth required → per-user rate limit `places:${id}` (60/min) → `{configured:false}` if no key →
  `{results:[]}` if `q`<2 → else `{configured:true, error:!ok, results:[…≤5]}`.
- `Env`: `FOURSQUARE_API_KEY` (+ optional `FOURSQUARE_API_BASE`, `_API_VERSION`, `_CATEGORIES`, `_FIELDS`).

## Storage (migration `0028_event_venue.sql`)
`events` gains `venue_name, formatted_address, latitude, longitude, place_id, place_provider`
(+ `idx_events_lat_lng`). Existing `location` stays as the display string. `createEvent` persists
them; `EventDto` + `getState` return them. Supports future map view / nearby plans / distance
filtering / venue pages (req §9). `place_id`/`place_provider` are provider-neutral.

## Frontend (`src/main.jsx`)
- `VenueAutocomplete` — controlled; 300ms debounce; optional geolocation (on focus) for the
  distance column; loading / "No venues found" / **"Use custom location"** rows; closes on select;
  stale-response guard; `[places]` logs (query, count, select, errors). Replaces the Location
  `<input>` in `HostEventPage`; `form.venue` holds the structured selection.
- `createHostedEvent` posts `venueName/formattedAddress/latitude/longitude/placeId/placeProvider`
  alongside `place` (= venue name or custom text). Validation still requires a non-empty location;
  coordinates saved when available.

## Config / deploy
- Local: add `FOURSQUARE_API_KEY` to `.dev.vars`. Remote: `wrangler secret put FOURSQUARE_API_KEY`.
- D1 migration is **not** applied by `wrangler deploy` — run `npm run d1:migrate:remote`
  (and `:local`) before deploying the new worker.

## Tests
- `tests/unit/places-normalize.test.ts` — both API shapes + origin-distance + null guards.
- `tests/api/places-search.test.ts` — guest 401; authed + unconfigured → `{configured:false}`.
- `tests/integration/event-venue.test.ts` — venue fields round-trip through `/api/state`.

## Status
Shipped with **graceful degradation** (works before a key exists). Add the Foursquare Service key
secret to enable live suggestions. "Near Me" and category hard-filtering intentionally deferred
(category filter is env-configurable via `FOURSQUARE_CATEGORIES`).
