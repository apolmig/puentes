import { mkdir, unlink, writeFile } from "node:fs/promises"
import { extname, join } from "node:path"

import {
  type PacketAsset,
  deriveAssetKindFromMimeType,
} from "@/lib/bridgebeat"
import {
  addAssetInDb,
  getPacketAssetFromDb,
  removeAssetInDb,
} from "@/lib/server/bridgebeat-db"

function sanitizeSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "")
}

function extensionFromMimeType(mimeType: string) {
  const lookup: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "audio/mpeg": ".mp3",
    "audio/mp4": ".m4a",
    "audio/wav": ".wav",
    "audio/webm": ".webm",
    "audio/ogg": ".ogg",
    "application/pdf": ".pdf",
  }

  return lookup[mimeType] ?? ""
}

function buildStoredName(file: File) {
  const originalExt = extname(file.name)
  const extension = sanitizeSegment(originalExt) || extensionFromMimeType(file.type) || ".bin"
  const stem = sanitizeSegment(file.name.replace(originalExt, "")) || "asset"
  const token = crypto.randomUUID().slice(0, 8)

  return `${stem}-${token}${extension}`
}

function assetUrlToFilePath(url: string) {
  return join(process.cwd(), "public", url.replace(/^\//, ""))
}

export async function storePacketAsset(input: {
  packetId: string
  file: File
  label?: string
}) {
  const packetDirectory = join(process.cwd(), "public", "uploads", "packets", input.packetId)
  await mkdir(packetDirectory, { recursive: true })

  const storedName = buildStoredName(input.file)
  const targetPath = join(packetDirectory, storedName)
  const buffer = Buffer.from(await input.file.arrayBuffer())

  await writeFile(targetPath, buffer)

  const asset: PacketAsset = {
    id: `asset-${crypto.randomUUID().slice(0, 8)}`,
    kind: deriveAssetKindFromMimeType(input.file.type),
    label: input.label?.trim() || input.file.name,
    fileName: input.file.name,
    mimeType: input.file.type || "application/octet-stream",
    size: input.file.size,
    url: `/uploads/packets/${input.packetId}/${storedName}`,
    createdAt: new Date().toISOString(),
  }

  await addAssetInDb(input.packetId, asset)
  return asset
}

export async function deletePacketAsset(packetId: string, assetId: string) {
  const asset = await getPacketAssetFromDb(packetId, assetId)

  if (!asset) {
    return null
  }

  try {
    await unlink(assetUrlToFilePath(asset.url))
  } catch {
    // Ignore missing files and keep the database clean.
  }

  await removeAssetInDb(packetId, assetId)
  return asset
}
