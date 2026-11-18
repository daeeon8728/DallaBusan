CREATE TABLE attraction_pages (
  cache_key TEXT PRIMARY KEY,
  payload TEXT NOT NULL CHECK(json_valid(payload))
) STRICT;
CREATE TABLE attraction_records (
  locale TEXT NOT NULL CHECK(locale IN ('ko','en','ja','zh-CN','zh-TW')),
  source_id TEXT NOT NULL,
  place_id TEXT NOT NULL REFERENCES places(id) ON DELETE RESTRICT,
  payload TEXT NOT NULL CHECK(json_valid(payload)),
  fetched_at TEXT NOT NULL,
  PRIMARY KEY(locale,source_id)
) STRICT;
CREATE TABLE attraction_imports (
  id INTEGER PRIMARY KEY,
  locale TEXT NOT NULL,
  started_at TEXT NOT NULL,
  payload TEXT NOT NULL CHECK(json_valid(payload))
) STRICT;
