-- Migration: 0009_clean_trust_schema.sql
PRAGMA foreign_keys = ON;

-- 1. Drop duplicate legacy table
DROP TABLE IF EXISTS event_reviews;
