import { createHash } from "node:crypto"

import type { PacketAssetKind } from "@/lib/bridgebeat"
import { getCloudinaryRuntimeConfig } from "@/lib/server/runtime-config"

type CloudinaryUploadPayload = {
  secure_url?: unknown
  public_id?: unknown
  asset_id?: unknown
  resource_type?: unknown
  error?: {
    message?: unknown
  }
  result?: unknown
}

function sanitizeSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "")
}

function buildSignature(params: Record<string, string>, apiSecret: string) {
  const body = Object.entries(params)
    .filter(([, value]) => value.length > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&")

  return createHash("sha1")
    .update(`${body}${apiSecret}`)
    .digest("hex")
}

function getCloudinaryErrorMessage(payload: CloudinaryUploadPayload, fallback: string) {
  if (typeof payload.error?.message === "string" && payload.error.message.length > 0) {
    return payload.error.message
  }

  return fallback
}

function getCloudinaryResourceType(kind: PacketAssetKind) {
  if (kind === "image") {
    return "image"
  }

  if (kind === "video" || kind === "audio") {
    return "video"
  }

  return "raw"
}

function buildPacketAssetPublicId(packetId: string, fileName: string) {
  const stem = sanitizeSegment(fileName.replace(/\.[^/.]+$/, "")) || "asset"
  const safePacketId = sanitizeSegment(packetId) || "packet"

  return `puentes/packets/${safePacketId}/${stem}-${crypto.randomUUID().slice(0, 8)}`
}

export async function uploadPacketAssetToCloudinary(input: {
  packetId: string
  file: File
  kind: PacketAssetKind
}) {
  const config = getCloudinaryRuntimeConfig()

  if (!config) {
    return null
  }

  const resourceType = getCloudinaryResourceType(input.kind)
  const timestamp = String(Math.floor(Date.now() / 1000))
  const publicId = buildPacketAssetPublicId(input.packetId, input.file.name)
  const signature = buildSignature(
    {
      public_id: publicId,
      timestamp,
    },
    config.apiSecret,
  )
  const formData = new FormData()

  formData.set("file", input.file)
  formData.set("api_key", config.apiKey)
  formData.set("public_id", publicId)
  formData.set("timestamp", timestamp)
  formData.set("signature", signature)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/upload`,
    {
      method: "POST",
      body: formData,
    },
  )
  const payload = (await response.json()) as CloudinaryUploadPayload

  if (!response.ok) {
    throw new Error(
      `Cloudinary upload failed: ${getCloudinaryErrorMessage(payload, "request was rejected")}`,
    )
  }

  if (
    typeof payload.secure_url !== "string" ||
    typeof payload.public_id !== "string" ||
    typeof payload.asset_id !== "string" ||
    typeof payload.resource_type !== "string"
  ) {
    throw new Error("Cloudinary upload failed: response payload was incomplete.")
  }

  return {
    secureUrl: payload.secure_url,
    publicId: payload.public_id,
    assetId: payload.asset_id,
    resourceType: payload.resource_type,
  }
}

export async function deletePacketAssetFromCloudinary(input: {
  publicId: string
  resourceType?: string
}) {
  const config = getCloudinaryRuntimeConfig()

  if (!config) {
    return false
  }

  const resourceType = input.resourceType || "raw"
  const timestamp = String(Math.floor(Date.now() / 1000))
  const signature = buildSignature(
    {
      public_id: input.publicId,
      timestamp,
    },
    config.apiSecret,
  )
  const formData = new FormData()

  formData.set("api_key", config.apiKey)
  formData.set("public_id", input.publicId)
  formData.set("timestamp", timestamp)
  formData.set("signature", signature)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/destroy`,
    {
      method: "POST",
      body: formData,
    },
  )
  const payload = (await response.json()) as CloudinaryUploadPayload

  if (!response.ok) {
    throw new Error(
      `Cloudinary delete failed: ${getCloudinaryErrorMessage(payload, "request was rejected")}`,
    )
  }

  if (payload.result !== "ok" && payload.result !== "not found") {
    throw new Error("Cloudinary delete failed: unexpected response.")
  }

  return payload.result === "ok"
}
