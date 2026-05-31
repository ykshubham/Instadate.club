-- Migration: 0011_seed_indicator.sql
PRAGMA foreign_keys = ON;

-- Add seed_data indicator to track development seed records clearly
ALTER TABLE users ADD COLUMN seed_data INTEGER NOT NULL DEFAULT 0 CHECK (seed_data IN (0, 1));
ALTER TABLE profiles ADD COLUMN seed_data INTEGER NOT NULL DEFAULT 0 CHECK (seed_data IN (0, 1));
ALTER TABLE events ADD COLUMN seed_data INTEGER NOT NULL DEFAULT 0 CHECK (seed_data IN (0, 1));
ALTER TABLE chats ADD COLUMN seed_data INTEGER NOT NULL DEFAULT 0 CHECK (seed_data IN (0, 1));
ALTER TABLE analytics_events ADD COLUMN seed_data INTEGER NOT NULL DEFAULT 0 CHECK (seed_data IN (0, 1));
