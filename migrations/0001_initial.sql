CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  age TEXT,
  instagram TEXT,
  city TEXT,
  whatsapp TEXT,
  gender TEXT,
  intent TEXT,
  weekend_status TEXT,
  bio TEXT,
  vibe TEXT,
  photo TEXT,
  photos_json TEXT NOT NULL DEFAULT '[]',
  profile_json TEXT NOT NULL DEFAULT '{}',
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  host_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  display_date TEXT NOT NULL,
  raw_date TEXT,
  display_time TEXT NOT NULL,
  image TEXT NOT NULL,
  status TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('Free', 'Paid')),
  price TEXT,
  approval_type TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'hosted',
  is_closed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS event_attendees (
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'joined' CHECK (status IN ('joined', 'cancelled', 'refunded')),
  joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  requester_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_member_id TEXT NOT NULL,
  target_member_name TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'requested',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  participant_a_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  participant_b_user_id TEXT,
  verified_by_user_ids_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('you', 'match', 'system')),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_visible ON events(deleted_at, is_closed, created_at);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user ON event_attendees(user_id, status);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON event_attendees(event_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_requester ON matches(requester_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat ON chat_messages(chat_id, created_at);
