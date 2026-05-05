import { mkdir, unlink, writeFile } from "node:fs/promises"
import { extname, join, relative, resolve, sep } from "node:path"

import {
  type PacketAsset,
  deriveAssetKindFromMimeType,
} from "@/lib/bridgebeat"
import {
  deletePacketAssetFromCloudinary,
  uploadPacketAssetToCloudinary,
} from "@/lib/server/cloudinary"
import {
  addAssetInDb,
  getPacketAssetFromDb,
  removeAssetInDb,
} from "@/lib/server/bridgebeat-db"
import { getCloudinaryRuntimeConfig } from "@/lib/server/runtime-config"

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
  if (!url.startsWith("/uploads/packets/")) {
    return null
  }

  let decodedUrl

  try {
    decodedUrl = decodeURIComponent(url)
  } catch {
    return null
  }

  const uploadsRoot = resolve(process.cwd(), "public", "uploads", "packets")
  const targetPath = resolve(process.cwd(), "public", decodedUrl.replace(/^\/+/, ""))
  const relativeTarget = relative(uploadsRoot, targetPath)

  if (
    relativeTarget === "" ||
    relativeTarget.startsWith("..") ||
    relativeTarget.includes(`..${sep}`) ||
    resolve(relativeTarget) === relativeTarget
  ) {
    return null
  }

  return targetPath
}

async function storePacketAssetLocally(input: {
  packetId: string
  file: File
  label?: string
  kind: PacketAsset["kind"]
}) {
  const safePacketId = sanitizeSegment(input.packetId) || "packet"
  const packetDirectory = join(process.cwd(), "public", "uploads", "packets", safePacketId)
  await mkdir(packetDirectory, { recursive: true })

  const storedName = buildStoredName(input.file)
  const targetPath = join(packetDirectory, storedName)
  const buffer = Buffer.from(await input.file.arrayBuffer())

  await writeFile(targetPath, buffer)

  return {
    kind: input.kind,
    label: input.label?.trim() || input.file.name,
    fileName: input.file.name,
    mimeType: input.file.type || "application/octet-stream",
    size: input.file.size,
    url: `/uploads/packets/${safePacketId}/${storedName}`,
    createdAt: new Date().toISOString(),
    storageProvider: "local" as const,
    storageKey: `/uploads/packets/${safePacketId}/${storedName}`,
    storageAssetId: "",
    storageResourceType: "raw",
  }
}

export async function storePacketAsset(input: {
  packetId: string
  file: File
  label?: string
}) {
  const kind = deriveAssetKindFromMimeType(input.file.type)
  const uploadedAsset = await uploadPacketAssetToCloudinary({
    packetId: input.packetId,
    file: input.file,
    kind,
  })

  const asset: PacketAsset = uploadedAsset
    ? {
        id: `asset-${crypto.randomUUID().slice(0, 8)}`,
        kind,
        label: input.label?.trim() || input.file.name,
        fileName: input.file.name,
        mimeType: input.file.type || "application/octet-stream",
        size: input.file.size,
        url: uploadedAsset.secureUrl,
        createdAt: new Date().toISOString(),
        storageProvider: "cloudinary",
        storageKey: uploadedAsset.publicId,
        storageAssetId: uploadedAsset.assetId,
        storageResourceType: uploadedAsset.resourceType,
      }
    : {
        id: `asset-${crypto.randomUUID().slice(0, 8)}`,
        ...(await storePacketAssetLocally({
          packetId: input.packetId,
          file: input.file,
          label: input.label,
          kind,
        })),
      }

  await addAssetInDb(input.packetId, asset)
  return asset
}

export async function deletePacketAsset(packetId: string, assetId: string) {
  const asset = await getPacketAssetFromDb(packetId, assetId)

  if (!asset) {
    return null
  }

  if (
    asset.storageProvider === "cloudinary" &&
    asset.storageKey.startsWith("puentes/packets/") &&
    asset.storageAssetId
  ) {
    await deletePacketAssetFromCloudinary({
      publicId: asset.storageKey,
      resourceType: asset.storageResourceType,
    })
  } else {
    const assetPath = assetUrlToFilePath(asset.url)

    try {
      if (assetPath) {
        await unlink(assetPath)
      }
    } catch {
      // Ignore missing files and keep the database clean.
    }
  }

  await removeAssetInDb(packetId, assetId)
  return asset
}

export function hasHostedAssetStorage() {
  return Boolean(getCloudinaryRuntimeConfig())
}
