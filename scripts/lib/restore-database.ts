import { readFile, mkdir, open, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';

const TABLES = ['schema_migrations', 'providers', 'places', 'place_translations', 'products', 'attraction_pages', 'attraction_records', 'attraction_imports'] as const;
export const DatabaseSnapshotManifestSchema = z.strictObject({
  version: z.literal(1), createdAt: z.iso.datetime(), source: z.literal('local-public-tourism-catalog'),
  sha256: z.string().regex(/^[a-f0-9]{64}$/), tables: z.record(z.enum(TABLES), z.number().int().nonnegative()),
});

/** Restore only a new DB: an existing catalog is never replaced. */
export async function restoreDatabaseSnapshot(source: URL, manifestFile: URL, destination: string) {
  if (destination === ':memory:') throw new Error('A file database is required for restoration');
  const raw: unknown = JSON.parse(await readFile(manifestFile, 'utf8'));
  const manifest = DatabaseSnapshotManifestSchema.parse(raw);
  const bytes = await readFile(source);
  if (createHash('sha256').update(bytes).digest('hex') !== manifest.sha256) throw new Error('Database backup checksum mismatch');
  const db = new DatabaseSync(fileURLToPath(source), { readOnly: true });
  try {
    if (db.prepare('PRAGMA integrity_check').get()?.integrity_check !== 'ok' || db.prepare('PRAGMA foreign_key_check').all().length !== 0) throw new Error('Invalid database backup');
    const stored = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name").all();
    if (stored.length !== TABLES.length || stored.some(row => !TABLES.some(table => table === row.name))) throw new Error('Unexpected database backup tables');
    for (const table of TABLES) {
      if (db.prepare('SELECT count(*) AS count FROM ' + table).get()?.count !== manifest.tables[table]) throw new Error('Database backup row count mismatch');
    }
  } finally { db.close(); }
  await mkdir(dirname(destination), { recursive: true });
  // wx prevents concurrent restoration from replacing an existing file too.
  const target = await open(destination, 'wx');
  try { await target.writeFile(bytes); await target.sync(); }
  catch (error) { await target.close(); await unlink(destination); throw error; }
  await target.close();
  return manifest.tables;
}
