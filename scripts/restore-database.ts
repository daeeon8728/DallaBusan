import { loadDatabaseConfig } from '../apps/server/src/config/env.js';
import { restoreDatabaseSnapshot } from './lib/restore-database.js';
try {
  const tables = await restoreDatabaseSnapshot(new URL('../data/snapshots/trip-fit.sqlite', import.meta.url), new URL('../data/snapshots/manifest.json', import.meta.url), loadDatabaseConfig().filename);
  console.log(JSON.stringify({ status: 'restored', tables }));
} catch {
  console.error('Database restore failed. Existing databases are never overwritten. Check the destination and backup manifest; details redacted.');
  process.exitCode = 1;
}
