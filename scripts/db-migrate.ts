import { openDatabase, migrate } from '../apps/server/src/db/client.js';
import { loadDatabaseConfig } from '../apps/server/src/config/env.js';

const db = openDatabase(loadDatabaseConfig().filename);
try { console.log('Applied migrations: ' + migrate(db)); }
finally { db.close(); }
