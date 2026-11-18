CREATE TABLE providers (
  id TEXT PRIMARY KEY, payload TEXT NOT NULL CHECK(json_valid(payload))
) STRICT;
CREATE TABLE places (
  id TEXT PRIMARY KEY, payload TEXT NOT NULL CHECK(json_valid(payload))
) STRICT;
CREATE TABLE place_translations (
  place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK(locale IN ('ko','en','ja','zh-CN','zh-TW')),
  payload TEXT NOT NULL CHECK(json_valid(payload)),
  PRIMARY KEY(place_id,locale)
) STRICT;
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  place_id TEXT NOT NULL REFERENCES places(id) ON DELETE RESTRICT,
  provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
  external_product_id TEXT NOT NULL,
  payload TEXT NOT NULL CHECK(json_valid(payload)),
  UNIQUE(provider_id,external_product_id)
) STRICT;
CREATE INDEX products_place_idx ON products(place_id);
