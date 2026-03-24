import { mkdir } from "node:fs/promises"
import { join } from "node:path"

import { createClient } from "@libsql/client"
import { and, asc, eq, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/libsql"

import {
  packetAssetsTable,
  packetReviewItemsTable,
  packetSignalsTable,
  packetSourcesTable,
  packetVariantsTable,
  packetsTable,
} from "@/db/schema"
import {
  type AudienceMode,
  type PacketAsset,
  type PacketRecord,
  type PacketSignal,
  type PacketSource,
  type PacketStatus,
  audienceModes,
  seedPackets,
} from "@/lib/bridgebeat"
import {
  getDatabaseRuntimeConfig,
  shouldSeedPackets,
} from "@/lib/server/runtime-config"

const databaseConfig = getDatabaseRuntimeConfig()

const client = createClient({
  url: databaseConfig.url,
  authToken: databaseConfig.authToken,
})

const db = drizzle(client)

let initPromise: Promise<void> | null = null

async function ensureDatabaseDirectory() {
  if (!databaseConfig.isLocal) {
    return
  }

  await mkdir(join(process.cwd(), "data"), { recursive: true })
}

async function ensurePacketColumns() {
  const tableInfo = await client.execute("PRAGMA table_info(packets)")
  const existingColumns = new Set(
    tableInfo.rows.map((row) => String((row as Record<string, unknown>).name)),
  )

  const pendingColumns = [
    { name: "channel", statement: "ALTER TABLE packets ADD COLUMN channel TEXT NOT NULL DEFAULT 'community intake'" },
    { name: "region", statement: "ALTER TABLE packets ADD COLUMN region TEXT NOT NULL DEFAULT 'general'" },
    { name: "urgency", statement: "ALTER TABLE packets ADD COLUMN urgency TEXT NOT NULL DEFAULT 'watch'" },
    { name: "confidence", statement: "ALTER TABLE packets ADD COLUMN confidence TEXT NOT NULL DEFAULT 'unverified'" },
    { name: "lead_audience", statement: "ALTER TABLE packets ADD COLUMN lead_audience TEXT NOT NULL DEFAULT 'creator'" },
  ] as const

  for (const column of pendingColumns) {
    if (!existingColumns.has(column.name)) {
      await client.execute(column.statement)
    }
  }
}

async function ensurePacketAssetColumns() {
  const tableInfo = await client.execute("PRAGMA table_info(packet_assets)")
  const existingColumns = new Set(
    tableInfo.rows.map((row) => String((row as Record<string, unknown>).name)),
  )

  const pendingColumns = [
    {
      name: "storage_provider",
      statement: "ALTER TABLE packet_assets ADD COLUMN storage_provider TEXT NOT NULL DEFAULT 'local'",
    },
    {
      name: "storage_key",
      statement: "ALTER TABLE packet_assets ADD COLUMN storage_key TEXT NOT NULL DEFAULT ''",
    },
    {
      name: "storage_asset_id",
      statement: "ALTER TABLE packet_assets ADD COLUMN storage_asset_id TEXT NOT NULL DEFAULT ''",
    },
    {
      name: "storage_resource_type",
      statement: "ALTER TABLE packet_assets ADD COLUMN storage_resource_type TEXT NOT NULL DEFAULT 'raw'",
    },
  ] as const

  for (const column of pendingColumns) {
    if (!existingColumns.has(column.name)) {
      await client.execute(column.statement)
    }
  }
}

async function bootstrapTables() {
  await ensureDatabaseDirectory()

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS packets (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      pulse TEXT NOT NULL,
      intake_format TEXT NOT NULL,
      source_link TEXT NOT NULL,
      channel TEXT NOT NULL,
      region TEXT NOT NULL,
      urgency TEXT NOT NULL,
      confidence TEXT NOT NULL,
      lead_audience TEXT NOT NULL,
      claim TEXT NOT NULL,
      truth TEXT NOT NULL,
      risk TEXT NOT NULL,
      status TEXT NOT NULL,
      review_notes TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)

  await ensurePacketColumns()

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS packet_signals (
      id TEXT PRIMARY KEY NOT NULL,
      packet_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      label TEXT NOT NULL,
      platform TEXT NOT NULL,
      summary TEXT NOT NULL,
      url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(packet_id) REFERENCES packets(id) ON DELETE CASCADE
    )
  `)

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS packet_assets (
      id TEXT PRIMARY KEY NOT NULL,
      packet_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      label TEXT NOT NULL,
      file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL DEFAULT 0,
      url TEXT NOT NULL,
      created_at TEXT NOT NULL,
      storage_provider TEXT NOT NULL DEFAULT 'local',
      storage_key TEXT NOT NULL DEFAULT '',
      storage_asset_id TEXT NOT NULL DEFAULT '',
      storage_resource_type TEXT NOT NULL DEFAULT 'raw',
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(packet_id) REFERENCES packets(id) ON DELETE CASCADE
    )
  `)
  await ensurePacketAssetColumns()

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS packet_sources (
      id TEXT PRIMARY KEY NOT NULL,
      packet_id TEXT NOT NULL,
      label TEXT NOT NULL,
      type TEXT NOT NULL,
      detail TEXT NOT NULL,
      url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(packet_id) REFERENCES packets(id) ON DELETE CASCADE
    )
  `)

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS packet_variants (
      id TEXT PRIMARY KEY NOT NULL,
      packet_id TEXT NOT NULL,
      audience TEXT NOT NULL,
      format TEXT NOT NULL,
      hook TEXT NOT NULL,
      body TEXT NOT NULL,
      cta TEXT NOT NULL,
      FOREIGN KEY(packet_id) REFERENCES packets(id) ON DELETE CASCADE
    )
  `)

  await db.run(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS packet_variants_packet_audience_idx
    ON packet_variants (packet_id, audience)
  `)

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS packet_review_items (
      id TEXT PRIMARY KEY NOT NULL,
      packet_id TEXT NOT NULL,
      label TEXT NOT NULL,
      checked INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(packet_id) REFERENCES packets(id) ON DELETE CASCADE
    )
  `)
}

async function mapPacket(packetId: string): Promise<PacketRecord> {
  const [packet] = await db.select().from(packetsTable).where(eq(packetsTable.id, packetId)).limit(1)

  if (!packet) {
    throw new Error(`Packet ${packetId} not found`)
  }

  const signals = await db
    .select()
    .from(packetSignalsTable)
    .where(eq(packetSignalsTable.packetId, packetId))
    .orderBy(asc(packetSignalsTable.sortOrder))

  const assets = await db
    .select()
    .from(packetAssetsTable)
    .where(eq(packetAssetsTable.packetId, packetId))
    .orderBy(asc(packetAssetsTable.sortOrder))

  const sources = await db
    .select()
    .from(packetSourcesTable)
    .where(eq(packetSourcesTable.packetId, packetId))
    .orderBy(asc(packetSourcesTable.sortOrder))

  const variants = await db
    .select()
    .from(packetVariantsTable)
    .where(eq(packetVariantsTable.packetId, packetId))

  const reviewItems = await db
    .select()
    .from(packetReviewItemsTable)
    .where(eq(packetReviewItemsTable.packetId, packetId))
    .orderBy(asc(packetReviewItemsTable.sortOrder))

  return {
    id: packet.id,
    title: packet.title,
    pulse: packet.pulse,
    intakeFormat: packet.intakeFormat,
    sourceLink: packet.sourceLink,
    channel: packet.channel,
    region: packet.region,
    urgency: packet.urgency as PacketRecord["urgency"],
    confidence: packet.confidence as PacketRecord["confidence"],
    leadAudience: packet.leadAudience as PacketRecord["leadAudience"],
    claim: packet.claim,
    truth: packet.truth,
    risk: packet.risk,
    status: packet.status as PacketStatus,
    createdAt: packet.createdAt,
    updatedAt: packet.updatedAt,
    signals: signals.map((signal) => ({
      id: signal.id,
      kind: signal.kind,
      label: signal.label,
      platform: signal.platform,
      summary: signal.summary,
      url: signal.url,
    })),
    assets: assets.map((asset) => ({
      id: asset.id,
      kind: asset.kind as PacketAsset["kind"],
      label: asset.label,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      size: asset.size,
      url: asset.url,
      createdAt: asset.createdAt,
      storageProvider: asset.storageProvider as PacketAsset["storageProvider"],
      storageKey: asset.storageKey,
      storageAssetId: asset.storageAssetId,
      storageResourceType: asset.storageResourceType,
    })),
    sources: sources.map((source) => ({
      id: source.id,
      label: source.label,
      type: source.type,
      detail: source.detail,
      url: source.url,
    })),
    variants: Object.fromEntries(
      audienceModes.map((audience) => {
        const variant = variants.find((item) => item.audience === audience)

        return [
          audience,
          {
            format: variant?.format ?? "",
            hook: variant?.hook ?? "",
            body: variant?.body ?? "",
            cta: variant?.cta ?? "",
          },
        ]
      }),
    ) as PacketRecord["variants"],
    reviewChecklist: reviewItems.map((item) => ({
      id: item.id,
      label: item.label,
      checked: item.checked,
    })),
    reviewNotes: packet.reviewNotes,
  }
}

async function insertPacketRecord(record: PacketRecord) {
  await db.insert(packetsTable).values({
    id: record.id,
    title: record.title,
    pulse: record.pulse,
    intakeFormat: record.intakeFormat,
    sourceLink: record.sourceLink,
    channel: record.channel,
    region: record.region,
    urgency: record.urgency,
    confidence: record.confidence,
    leadAudience: record.leadAudience,
    claim: record.claim,
    truth: record.truth,
    risk: record.risk,
    status: record.status,
    reviewNotes: record.reviewNotes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  })

  if (record.signals.length > 0) {
    await db.insert(packetSignalsTable).values(
      record.signals.map((signal, index) => ({
        id: signal.id,
        packetId: record.id,
        kind: signal.kind,
        label: signal.label,
        platform: signal.platform,
        summary: signal.summary,
        url: signal.url,
        sortOrder: index,
      })),
    )
  }

  if (record.assets.length > 0) {
    await db.insert(packetAssetsTable).values(
      record.assets.map((asset, index) => ({
        id: asset.id,
        packetId: record.id,
        kind: asset.kind,
        label: asset.label,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        size: asset.size,
        url: asset.url,
        createdAt: asset.createdAt,
        storageProvider: asset.storageProvider ?? "local",
        storageKey: asset.storageKey ?? "",
        storageAssetId: asset.storageAssetId ?? "",
        storageResourceType: asset.storageResourceType ?? "raw",
        sortOrder: index,
      })),
    )
  }

  if (record.sources.length > 0) {
    await db.insert(packetSourcesTable).values(
      record.sources.map((source, index) => ({
        id: source.id,
        packetId: record.id,
        label: source.label,
        type: source.type,
        detail: source.detail,
        url: source.url,
        sortOrder: index,
      })),
    )
  }

  await db.insert(packetVariantsTable).values(
    audienceModes.map((audience) => ({
      id: `${record.id}-${audience}`,
      packetId: record.id,
      audience,
      format: record.variants[audience].format,
      hook: record.variants[audience].hook,
      body: record.variants[audience].body,
      cta: record.variants[audience].cta,
    })),
  )

  await db.insert(packetReviewItemsTable).values(
    record.reviewChecklist.map((item, index) => ({
      id: item.id,
      packetId: record.id,
      label: item.label,
      checked: item.checked,
      sortOrder: index,
    })),
  )
}

async function seedIfEmpty() {
  if (!shouldSeedPackets()) {
    return
  }

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(packetsTable)

  if (Number(count) > 0) {
    return
  }

  for (const packet of seedPackets()) {
    await insertPacketRecord(packet)
  }
}

async function touchPacket(id: string) {
  await db
    .update(packetsTable)
    .set({ updatedAt: new Date().toISOString() })
    .where(eq(packetsTable.id, id))
}

export async function ensureBridgeBeatDb() {
  if (!initPromise) {
    initPromise = (async () => {
      await bootstrapTables()
      await seedIfEmpty()
    })()
  }

  await initPromise
}

export async function listPacketsFromDb() {
  await ensureBridgeBeatDb()
  const basePackets = await db.select().from(packetsTable).orderBy(sql`${packetsTable.updatedAt} desc`)

  return Promise.all(basePackets.map((packet) => mapPacket(packet.id)))
}

export async function getPacketFromDb(id: string) {
  await ensureBridgeBeatDb()
  const [packet] = await db.select({ id: packetsTable.id }).from(packetsTable).where(eq(packetsTable.id, id)).limit(1)

  if (!packet) {
    return null
  }

  return mapPacket(id)
}

export async function createPacketInDb(record: PacketRecord) {
  await ensureBridgeBeatDb()
  const existing = await getPacketFromDb(record.id)

  if (existing) {
    return existing
  }

  await insertPacketRecord(record)
  return mapPacket(record.id)
}

export async function updatePacketInDb(
  id: string,
  patch: Partial<
    Omit<
      PacketRecord,
      "id" | "signals" | "assets" | "sources" | "variants" | "reviewChecklist" | "createdAt"
    >
  >,
) {
  await ensureBridgeBeatDb()

  await db
    .update(packetsTable)
    .set({
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.pulse !== undefined ? { pulse: patch.pulse } : {}),
      ...(patch.intakeFormat !== undefined ? { intakeFormat: patch.intakeFormat } : {}),
      ...(patch.sourceLink !== undefined ? { sourceLink: patch.sourceLink } : {}),
      ...(patch.channel !== undefined ? { channel: patch.channel } : {}),
      ...(patch.region !== undefined ? { region: patch.region } : {}),
      ...(patch.urgency !== undefined ? { urgency: patch.urgency } : {}),
      ...(patch.confidence !== undefined ? { confidence: patch.confidence } : {}),
      ...(patch.leadAudience !== undefined ? { leadAudience: patch.leadAudience } : {}),
      ...(patch.claim !== undefined ? { claim: patch.claim } : {}),
      ...(patch.truth !== undefined ? { truth: patch.truth } : {}),
      ...(patch.risk !== undefined ? { risk: patch.risk } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.reviewNotes !== undefined ? { reviewNotes: patch.reviewNotes } : {}),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(packetsTable.id, id))

  return mapPacket(id)
}

export async function getPacketAssetFromDb(id: string, assetId: string) {
  await ensureBridgeBeatDb()

  const [asset] = await db
    .select()
    .from(packetAssetsTable)
    .where(and(eq(packetAssetsTable.id, assetId), eq(packetAssetsTable.packetId, id)))
    .limit(1)

  if (!asset) {
    return null
  }

  return {
    id: asset.id,
    kind: asset.kind as PacketAsset["kind"],
    label: asset.label,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    size: asset.size,
    url: asset.url,
    createdAt: asset.createdAt,
    storageProvider: asset.storageProvider as PacketAsset["storageProvider"],
    storageKey: asset.storageKey,
    storageAssetId: asset.storageAssetId,
    storageResourceType: asset.storageResourceType,
  } satisfies PacketAsset
}

export async function addSignalInDb(id: string, signal: PacketSignal) {
  await ensureBridgeBeatDb()
  const existing = await db
    .select({ count: sql<number>`count(*)` })
    .from(packetSignalsTable)
    .where(eq(packetSignalsTable.packetId, id))

  await db.insert(packetSignalsTable).values({
    id: signal.id,
    packetId: id,
    kind: signal.kind,
    label: signal.label,
    platform: signal.platform,
    summary: signal.summary,
    url: signal.url,
    sortOrder: Number(existing[0]?.count ?? 0),
  })

  await touchPacket(id)
  return mapPacket(id)
}

export async function updateSignalInDb(
  id: string,
  signalId: string,
  patch: Partial<PacketSignal>,
) {
  await ensureBridgeBeatDb()

  await db
    .update(packetSignalsTable)
    .set({
      ...(patch.kind !== undefined ? { kind: patch.kind } : {}),
      ...(patch.label !== undefined ? { label: patch.label } : {}),
      ...(patch.platform !== undefined ? { platform: patch.platform } : {}),
      ...(patch.summary !== undefined ? { summary: patch.summary } : {}),
      ...(patch.url !== undefined ? { url: patch.url } : {}),
    })
    .where(and(eq(packetSignalsTable.id, signalId), eq(packetSignalsTable.packetId, id)))

  await touchPacket(id)
  return mapPacket(id)
}

export async function removeSignalInDb(id: string, signalId: string) {
  await ensureBridgeBeatDb()

  await db
    .delete(packetSignalsTable)
    .where(and(eq(packetSignalsTable.id, signalId), eq(packetSignalsTable.packetId, id)))

  await touchPacket(id)
  return mapPacket(id)
}

export async function addAssetInDb(id: string, asset: PacketAsset) {
  await ensureBridgeBeatDb()
  const existing = await db
    .select({ count: sql<number>`count(*)` })
    .from(packetAssetsTable)
    .where(eq(packetAssetsTable.packetId, id))

  await db.insert(packetAssetsTable).values({
    id: asset.id,
    packetId: id,
    kind: asset.kind,
    label: asset.label,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    size: asset.size,
    url: asset.url,
    createdAt: asset.createdAt,
    storageProvider: asset.storageProvider ?? "local",
    storageKey: asset.storageKey ?? "",
    storageAssetId: asset.storageAssetId ?? "",
    storageResourceType: asset.storageResourceType ?? "raw",
    sortOrder: Number(existing[0]?.count ?? 0),
  })

  await touchPacket(id)
  return mapPacket(id)
}

export async function removeAssetInDb(id: string, assetId: string) {
  await ensureBridgeBeatDb()

  await db
    .delete(packetAssetsTable)
    .where(and(eq(packetAssetsTable.id, assetId), eq(packetAssetsTable.packetId, id)))

  await touchPacket(id)
  return mapPacket(id)
}

export async function addSourceInDb(id: string, source: PacketSource) {
  await ensureBridgeBeatDb()
  const existing = await db
    .select({ count: sql<number>`count(*)` })
    .from(packetSourcesTable)
    .where(eq(packetSourcesTable.packetId, id))

  await db.insert(packetSourcesTable).values({
    id: source.id,
    packetId: id,
    label: source.label,
    type: source.type,
    detail: source.detail,
    url: source.url,
    sortOrder: Number(existing[0]?.count ?? 0),
  })

  await touchPacket(id)
  return mapPacket(id)
}

export async function updateSourceInDb(
  id: string,
  sourceId: string,
  patch: Partial<PacketSource>,
) {
  await ensureBridgeBeatDb()

  await db
    .update(packetSourcesTable)
    .set({
      ...(patch.label !== undefined ? { label: patch.label } : {}),
      ...(patch.type !== undefined ? { type: patch.type } : {}),
      ...(patch.detail !== undefined ? { detail: patch.detail } : {}),
      ...(patch.url !== undefined ? { url: patch.url } : {}),
    })
    .where(and(eq(packetSourcesTable.id, sourceId), eq(packetSourcesTable.packetId, id)))

  await touchPacket(id)
  return mapPacket(id)
}

export async function removeSourceInDb(id: string, sourceId: string) {
  await ensureBridgeBeatDb()

  const sources = await db
    .select({ id: packetSourcesTable.id })
    .from(packetSourcesTable)
    .where(eq(packetSourcesTable.packetId, id))

  if (sources.length <= 1) {
    return mapPacket(id)
  }

  await db
    .delete(packetSourcesTable)
    .where(and(eq(packetSourcesTable.id, sourceId), eq(packetSourcesTable.packetId, id)))

  await touchPacket(id)
  return mapPacket(id)
}

export async function updateVariantInDb(
  id: string,
  audience: AudienceMode,
  patch: Partial<PacketRecord["variants"][AudienceMode]>,
) {
  await ensureBridgeBeatDb()

  await db
    .update(packetVariantsTable)
    .set({
      ...(patch.format !== undefined ? { format: patch.format } : {}),
      ...(patch.hook !== undefined ? { hook: patch.hook } : {}),
      ...(patch.body !== undefined ? { body: patch.body } : {}),
      ...(patch.cta !== undefined ? { cta: patch.cta } : {}),
    })
    .where(and(eq(packetVariantsTable.packetId, id), eq(packetVariantsTable.audience, audience)))

  await touchPacket(id)
  return mapPacket(id)
}

export async function toggleReviewItemInDb(id: string, itemId: string) {
  await ensureBridgeBeatDb()

  const [item] = await db
    .select()
    .from(packetReviewItemsTable)
    .where(and(eq(packetReviewItemsTable.id, itemId), eq(packetReviewItemsTable.packetId, id)))
    .limit(1)

  if (!item) {
    return mapPacket(id)
  }

  await db
    .update(packetReviewItemsTable)
    .set({ checked: !item.checked })
    .where(eq(packetReviewItemsTable.id, itemId))

  await touchPacket(id)
  return mapPacket(id)
}

export async function setReviewNotesInDb(id: string, notes: string) {
  return updatePacketInDb(id, { reviewNotes: notes })
}

export async function setStatusInDb(id: string, status: PacketStatus) {
  return updatePacketInDb(id, { status })
}
