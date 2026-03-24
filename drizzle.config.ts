import "dotenv/config"

import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "sqlite",
  schema: "./db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url:
      process.env.PUENTES_DATABASE_URL ??
      process.env.BRIDGEBEAT_DATABASE_URL ??
      "file:./data/puentes.db",
  },
})
