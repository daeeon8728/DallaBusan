import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export function openDatabase(filename: string, options: { readOnly?: boolean } = {}) {
  if (!options.readOnly && filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename, { readOnly: options.readOnly ?? false });
  db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  return db;
}
export function transaction<T>(db: DatabaseSync, work: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try { const result = work(); db.exec('COMMIT'); return result; }
  catch (error) { db.exec('ROLLBACK'); throw error; }
}
export function migrate(db: DatabaseSync, directory = fileURLToPath(new URL('../../db/migrations/', import.meta.url))) {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL) STRICT');
  let applied = 0;
  for (const name of readdirSync(directory).filter(name => /^\d+_[a-z0-9_]+\.sql$/.test(name)).sort()) {
    const sql = readFileSync(join(directory, name), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const previous = db.prepare('SELECT checksum FROM schema_migrations WHERE name = ?').get(name);
    if (previous) {
      if (previous.checksum !== checksum) throw new Error('Applied migration checksum changed: ' + name);
      continue;
    }
    transaction(db, () => {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (name,checksum) VALUES (?,?)').run(name,checksum);
    });
    applied++;
  }
  return applied;
}
