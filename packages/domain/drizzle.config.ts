import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema/adapters/sqlite.ts",
  out: "./migrations",
  verbose: true,
  strict: true,
});
