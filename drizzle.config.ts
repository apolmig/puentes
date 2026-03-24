import "dotenv/config"

import { defineConfig } from "drizzle-kit"

const databaseUrl =
  process.env.TURSO_DATABASE_URL ??
  process.env.PUENTES_DATABASE_URL ??
  process.env.BRIDGEBEAT_DATABASE_URL ??
  "file:./data/puentes.db"
const authToken =
  process.env.TURSO_AUTH_TOKEN ??
  process.env.PUENTES_DATABASE_AUTH_TOKEN ??
  process.env.BRIDGEBEAT_DATABASE_AUTH_TOKEN
const isRemoteDatabase = !databaseUrl.startsWith("file:")

export default defineConfig({
  dialect: isRemoteDatabase ? "turso" : "sqlite",
  schema: "./db/schema.ts",
  out: "./drizzle",
  dbCredentials: isRemoteDatabase
    ? {
        url: databaseUrl,
        authToken,
      }
    : {
        url: databaseUrl,
      },
})
