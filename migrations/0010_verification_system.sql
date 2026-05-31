-- Migration: 0010_verification_system.sql
PRAGMA foreign_keys = ON;

-- Add verification columns to profiles table to support Phone, Instagram, and Profile Verification Levels
ALTER TABLE profiles ADD COLUMN phone_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN instagram_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN profile_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN verification_level TEXT NOT NULL DEFAULT 'none';
