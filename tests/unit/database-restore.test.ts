import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { restoreDatabaseSnapshot, DatabaseSnapshotManifestSchema } from '../../scripts/lib/restore-database.js';
const source = new URL('../../data/snapshots/trip-fit.sqlite', import.meta.url);
const manifest = new URL('../../data/snapshots/manifest.json', import.meta.url);
async function temporary(work: (dir: string) => Promise<void>) {
  const dir = await mkdtemp(join(tmpdir(), 'dallabusan-restore-'));
  if (!resolve(dir).startsWith(resolve(tmpdir()) + sep) || !dir.includes('dallabusan-restore-')) throw new Error('Unsafe temporary directory');
  try { await work(dir); }
  finally {
    await rm(dir, { recursive: true, force: true });
  }
}
describe('portable database restoration', () => {
  it('restores exact backup bytes and original counts', async () => temporary(async dir => {
    const target = join(dir, 'new', 'catalog.sqlite');
    const tables = await restoreDatabaseSnapshot(source, manifest, target);
    expect(tables.attraction_records).toBe(1044);expect(tables.place_translations).toBe(1044);
    const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
    expect(hash(await readFile(target))).toBe(hash(await readFile(source)));
  }));
  it('never overwrites existing user data', async () => temporary(async dir => {
    const target = join(dir, 'existing.sqlite');await writeFile(target, 'existing user data');
    await expect(restoreDatabaseSnapshot(source, manifest, target)).rejects.toThrow();
    expect(await readFile(target, 'utf8')).toBe('existing user data');
  }));
  it('refuses altered bytes before creating a destination', async () => temporary(async dir => {
    const altered = join(dir, 'altered.sqlite');const target = join(dir, 'target.sqlite');await writeFile(altered, 'invalid backup');
    await expect(restoreDatabaseSnapshot(pathToFileURL(altered), manifest, target)).rejects.toThrow('checksum mismatch');
    await expect(readFile(target)).rejects.toThrow();
  }));
  it('refuses row count disagreement', async () => temporary(async dir => {
    const raw: unknown = JSON.parse(await readFile(manifest, 'utf8'));
    const alteredManifest = DatabaseSnapshotManifestSchema.parse(raw);alteredManifest.tables.attraction_records=1;
    const altered = join(dir, 'manifest.json');await writeFile(altered, JSON.stringify(alteredManifest));
    await expect(restoreDatabaseSnapshot(source, pathToFileURL(altered), join(dir,'target.sqlite'))).rejects.toThrow('row count mismatch');
  }));
  it('rejects in-memory restoration', async () => {
    await expect(restoreDatabaseSnapshot(source, manifest, ':memory:')).rejects.toThrow('file database');
  });
});
