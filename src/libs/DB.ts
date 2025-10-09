import { join } from 'node:path';
import * as schema from '@/models/Schema';
import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import pg from 'pg';
import { Env } from './Env';

const { Client } = pg;

let client: any;
let drizzle: any;

const isProduction = Env.NODE_ENV === 'production';
const forceLocal = !!Env.FORCE_LOCAL_DB && !['0', 'false', 'False', 'FALSE'].includes(Env.FORCE_LOCAL_DB);

// Decide whether to use remote Postgres or local PGlite
const shouldUseLocal = forceLocal || (!isProduction && !Env.DATABASE_URL);
const migrationsDir = join(process.cwd(), 'migrations');

if (!shouldUseLocal) {
  // Use remote Postgres. In true production (and when not forcing local), require DATABASE_URL.
  if (!Env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required when not using local PGlite. Set FORCE_LOCAL_DB=1 to use PGlite for builds/tests.');
  }

  client = new Client({ connectionString: Env.DATABASE_URL });
  await client.connect();
  drizzle = drizzlePg(client, { schema });
  // Only run migrations automatically when not production.
  if (!isProduction) {
    await migratePg(drizzle, { migrationsFolder: migrationsDir });
  }
} else {
  // Use embedded PGlite
  const dataDir = Env.PGLITE_DATA_DIR || '.pglite-data';
  client = new PGlite({ dataDir });
  drizzle = drizzlePglite({ client, schema });
  await migratePglite(drizzle, { migrationsFolder: migrationsDir });
}

export const db = drizzle;
export const dbClient = client;
