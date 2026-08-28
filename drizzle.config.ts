import { defineConfig } from "drizzle-kit";

// Drizzle uses the same SQLite dialect as Cloudflare D1 when generating future
// schema migrations from db/schema.ts.
export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "sqlite",
});
