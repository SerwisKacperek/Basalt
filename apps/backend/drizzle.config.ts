import { defineConfig } from "drizzle-kit";

const dialectConfigs = {
  postgresql: {
    dialect: 'postgresql' as const,
    dbCredentials: { url: process.env.DATABASE_URL! },
  },
  sqlite: {
    dialect: 'sqlite' as const,
    dbCredentials: { url: process.env.DATABASE_URL! },
  },
} as const;

const schemaPath = {
  postgresql: '../../packages/domain/src/schema/adapters/pg.ts',
  sqlite: '../../packages/domain/src/schema/adapters/sqlite.ts',
} as const;

type Dialect = keyof typeof dialectConfigs;
const dialect = (process.env.DB_DIALECT ?? 'postgresql') as Dialect;

export default defineConfig({
  ...dialectConfigs[dialect],
  schema: schemaPath[dialect],
  out: './db/migrations',
  verbose: true,
  strict: true,
});
