import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { ProviderSchema } from '@trip-fit/domain';
import { loadDatabaseConfig } from '../apps/server/src/config/env.js';
import { openDatabase, migrate } from '../apps/server/src/db/client.js';
import { seedCatalog } from '../apps/server/src/db/seed.js';

const readJson = (file: string): unknown => JSON.parse(readFileSync(new URL('../' + file, import.meta.url), 'utf8'));
const providers = z.object({ providers: z.array(ProviderSchema) }).parse(readJson('config/providers.example.json')).providers;
const places = z.strictObject({ places: z.array(z.unknown()), translations: z.array(z.unknown()) }).parse(readJson('data/places.seed.json'));
const products = z.strictObject({ products: z.array(z.unknown()) }).parse(readJson('data/products.seed.json'));
const db = openDatabase(loadDatabaseConfig().filename);
try {
  migrate(db);
  console.log(JSON.stringify(seedCatalog(db, { providers, ...places, ...products })));
} finally { db.close(); }
