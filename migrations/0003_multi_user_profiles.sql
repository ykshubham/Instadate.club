PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  age TEXT NOT NULL DEFAULT '',
  instagram TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  gender TEXT NOT NULL DEFAULT '',
  profession TEXT NOT NULL DEFAULT '',
  college TEXT NOT NULL DEFAULT '',
  intent TEXT NOT NULL DEFAULT '',
  weekend_status TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  vibe TEXT NOT NULL DEFAULT '',
  plan TEXT NOT NULL DEFAULT 'Instadate Plus',
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profile_photos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  position INTEGER NOT NULL DEFAULT 0,
  is_primary INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  preferences_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO profiles (
  user_id, full_name, age, instagram, city, whatsapp, gender, intent,
  weekend_status, bio, vibe, completed, created_at, updated_at
)
SELECT
  id, COALESCE(full_name, ''), COALESCE(age, ''), COALESCE(instagram, ''),
  COALESCE(city, ''), COALESCE(whatsapp, ''), COALESCE(gender, ''),
  COALESCE(intent, ''), COALESCE(weekend_status, ''), COALESCE(bio, ''),
  COALESCE(vibe, ''), COALESCE(completed, 0), created_at, updated_at
FROM users;

CREATE INDEX IF NOT EXISTS idx_profiles_completed ON profiles(completed, updated_at);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profile_photos_user ON profile_photos(user_id, position);
