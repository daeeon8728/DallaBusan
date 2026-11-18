# Local catalog

The production catalog seed intentionally has no places or products until data is verified.
Provider names come from config/providers.example.json; no API credentials are stored here.
All reviewed seed records require provenance, reviewedAt and verified status. Public API staging remains unverified.
Prices are decimal strings with currency and pricing unit; null means unknown.
Images require a source URL, author and license. Do not import photos without usage rights.
Test fixtures are constructed only in tests; the normal seed command rejects them.
Seed is transactional and repeatable. External product IDs are unique per provider.
Do not rename an applied migration: its SHA-256 checksum is recorded.

Commands: npm run db:migrate, npm run db:seed.
DATABASE_PATH in the root .env controls the SQLite location; default var/trip-fit.sqlite.
node:sqlite is experimental on the pinned Node 24 version. No external DB server is needed.

Public API import is available via npm run data:import -- --locale=ko (five locales).
Unreviewed imported places are locale-scoped and must not be used as verified planning candidates.
Photo URLs are staged only until author/license/source are reviewed. Explicit canonical mappings
belong to config/attraction-mappings.json. See docs/api-contracts.md and docs/operations.md.

## Portable snapshot (2026-11-18)

snapshots/trip-fit.sqlite preserves the existing public-tourism database. manifest.json records its SHA-256 and table row counts. Run npm run db:restore before starting a fresh checkout. Existing DATABASE_PATH is never overwritten. This is a fixed handoff snapshot, not a production seed or automatic backup. See ../docs/handoff.md.
