CREATE TABLE IF NOT EXISTS photo_requests (
  id TEXT PRIMARY KEY,
  artist_name TEXT NOT NULL,
  submitter_name TEXT NOT NULL,
  email TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  pending_object_key TEXT NOT NULL,
  original_type TEXT NOT NULL,
  client_fingerprint TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  decided_at TEXT,
  decided_by TEXT
);

CREATE INDEX IF NOT EXISTS photo_requests_status_date ON photo_requests(status, submitted_at);
CREATE INDEX IF NOT EXISTS photo_requests_fingerprint_date ON photo_requests(client_fingerprint, submitted_at);

CREATE TABLE IF NOT EXISTS artist_images (
  artist_name TEXT PRIMARY KEY COLLATE NOCASE,
  object_key TEXT NOT NULL UNIQUE,
  version INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
