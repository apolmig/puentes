import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

export const packetsTable = sqliteTable("packets", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  pulse: text("pulse").notNull(),
  intakeFormat: text("intake_format").notNull(),
  sourceLink: text("source_link").notNull(),
  channel: text("channel").notNull(),
  region: text("region").notNull(),
  urgency: text("urgency").notNull(),
  confidence: text("confidence").notNull(),
  leadAudience: text("lead_audience").notNull(),
  claim: text("claim").notNull(),
  truth: text("truth").notNull(),
  risk: text("risk").notNull(),
  status: text("status").notNull(),
  reviewNotes: text("review_notes").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
})

export const packetSignalsTable = sqliteTable("packet_signals", {
  id: text("id").primaryKey(),
  packetId: text("packet_id")
    .notNull()
    .references(() => packetsTable.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  label: text("label").notNull(),
  platform: text("platform").notNull(),
  summary: text("summary").notNull(),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
})

export const packetAssetsTable = sqliteTable("packet_assets", {
  id: text("id").primaryKey(),
  packetId: text("packet_id")
    .notNull()
    .references(() => packetsTable.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  label: text("label").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull().default(0),
  url: text("url").notNull(),
  createdAt: text("created_at").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
})

export const packetSourcesTable = sqliteTable("packet_sources", {
  id: text("id").primaryKey(),
  packetId: text("packet_id")
    .notNull()
    .references(() => packetsTable.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  type: text("type").notNull(),
  detail: text("detail").notNull(),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
})

export const packetVariantsTable = sqliteTable(
  "packet_variants",
  {
    id: text("id").primaryKey(),
    packetId: text("packet_id")
      .notNull()
      .references(() => packetsTable.id, { onDelete: "cascade" }),
    audience: text("audience").notNull(),
    format: text("format").notNull(),
    hook: text("hook").notNull(),
    body: text("body").notNull(),
    cta: text("cta").notNull(),
  },
  (table) => ({
    packetAudienceUnique: uniqueIndex("packet_variants_packet_audience_idx").on(
      table.packetId,
      table.audience,
    ),
  }),
)

export const packetReviewItemsTable = sqliteTable("packet_review_items", {
  id: text("id").primaryKey(),
  packetId: text("packet_id")
    .notNull()
    .references(() => packetsTable.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  checked: integer("checked", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
})
