-- Migration: 0028_event_venue.sql
-- Venue autocomplete (Foursquare Places API): structured venue fields on events.
-- The existing `location TEXT NOT NULL` stays as the human display string; these
-- columns add coordinates + place identity for future map view, nearby plans,
-- distance filtering, and venue pages/recommendations.
-- Rollback: SQLite cannot DROP COLUMN without a table rebuild; leave columns in place.

ALTER TABLE events ADD COLUMN venue_name TEXT;
ALTER TABLE events ADD COLUMN formatted_address TEXT;
ALTER TABLE events ADD COLUMN latitude REAL;
ALTER TABLE events ADD COLUMN longitude REAL;
ALTER TABLE events ADD COLUMN place_id TEXT;        -- Foursquare fsq id (provider-neutral name)
ALTER TABLE events ADD COLUMN place_provider TEXT;  -- 'foursquare' for now (future-proof)

-- Coarse geo index to support future distance/nearby queries.
CREATE INDEX IF NOT EXISTS idx_events_lat_lng ON events(latitude, longitude);
