-- 0030: Transfer token table for Capacitor (mobile app) Google OAuth handoff.
-- The mobile WebView cannot directly receive the session cookie from the
-- Cloudflare Worker callback because Google blocks embedded WebView OAuth.
-- Instead we open Chrome Custom Tabs, complete OAuth there, and pass a
-- one-time transfer token back to the app via a custom URL scheme deep link.
-- The app exchanges the token for a session cookie in the WebView.

CREATE TABLE IF NOT EXISTS auth_transfer_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL
);

ALTER TABLE oauth_states ADD COLUMN platform TEXT DEFAULT 'web';
