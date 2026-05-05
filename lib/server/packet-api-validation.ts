import {
  type AudienceMode,
  type PacketConfidence,
  type PacketRecord,
  type PacketSignal,
  type PacketSource,
  type PacketStatus,
  type PacketUrgency,
  audienceModes,
  confidenceLevels,
  createPacketRecord,
  urgencyLevels,
} from "@/lib/bridgebeat"

export class ApiValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ApiValidationError"
  }
}

type PacketPatch = Partial<
  Omit<
    PacketRecord,
    | "id"
    | "signals"
    | "assets"
    | "sources"
    | "variants"
    | "reviewChecklist"
    | "createdAt"
  >
>

export type ValidatedPatchBody =
  | {
      type: "updatePacket"
      patch: PacketPatch
    }
  | {
      type: "addSignal"
      signal: PacketSignal
    }
  | {
      type: "updateSignal"
      signalId: string
      patch: Partial<PacketSignal>
    }
  | {
      type: "removeSignal"
      signalId: string
    }
  | {
      type: "addSource"
      source: PacketSource
    }
  | {
      type: "updateSource"
      sourceId: string
      patch: Partial<PacketSource>
    }
  | {
      type: "removeSource"
      sourceId: string
    }
  | {
      type: "updateVariant"
      audience: AudienceMode
      patch: Partial<PacketRecord["variants"][AudienceMode]>
    }
  | {
      type: "toggleReviewItem"
      itemId: string
    }
  | {
      type: "setReviewNotes"
      notes: string
    }
  | {
      type: "setStatus"
      status: PacketStatus
    }

const statuses = ["draft", "review", "approved"] as const
const maxSignals = 12

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return ""
  }

  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength)
}

function cleanLongText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return ""
  }

  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ").trim().slice(0, maxLength)
}

function cleanId(value: unknown) {
  const id = cleanText(value, 80)

  if (!/^[a-z0-9._:-]+$/i.test(id)) {
    throw new ApiValidationError("Invalid record id.")
  }

  return id
}

function optionalEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fieldName: string,
): T | undefined {
  if (value === undefined) {
    return undefined
  }

  if (typeof value === "string" && allowed.includes(value as T)) {
    return value as T
  }

  throw new ApiValidationError(`Invalid ${fieldName}.`)
}

function requiredEnum<T extends string>(value: unknown, allowed: readonly T[], fieldName: string): T {
  const parsed = optionalEnum(value, allowed, fieldName)

  if (!parsed) {
    throw new ApiValidationError(`Missing ${fieldName}.`)
  }

  return parsed
}

function parseSignal(value: unknown): PacketSignal {
  if (!isRecord(value)) {
    throw new ApiValidationError("Invalid signal.")
  }

  return {
    id: `signal-${crypto.randomUUID().slice(0, 8)}`,
    kind: cleanText(value.kind, 80) || "manual note",
    label: cleanText(value.label, 140) || "New signal",
    platform: cleanText(value.platform, 100) || "community intake",
    summary: cleanLongText(value.summary, 1200),
    url: cleanText(value.url, 1000),
  }
}

function parsePatchSignal(value: unknown): Partial<PacketSignal> {
  if (!isRecord(value)) {
    throw new ApiValidationError("Invalid signal patch.")
  }

  return {
    ...(value.kind !== undefined ? { kind: cleanText(value.kind, 80) } : {}),
    ...(value.label !== undefined ? { label: cleanText(value.label, 140) } : {}),
    ...(value.platform !== undefined ? { platform: cleanText(value.platform, 100) } : {}),
    ...(value.summary !== undefined ? { summary: cleanLongText(value.summary, 1200) } : {}),
    ...(value.url !== undefined ? { url: cleanText(value.url, 1000) } : {}),
  }
}

function parseSource(value: unknown): PacketSource {
  if (!isRecord(value)) {
    throw new ApiValidationError("Invalid source.")
  }

  return {
    id: `source-${crypto.randomUUID().slice(0, 8)}`,
    label: cleanText(value.label, 140) || "New source",
    type: cleanText(value.type, 100) || "official record",
    detail: cleanLongText(value.detail, 1200),
    url: cleanText(value.url, 1000),
  }
}

function parsePatchSource(value: unknown): Partial<PacketSource> {
  if (!isRecord(value)) {
    throw new ApiValidationError("Invalid source patch.")
  }

  return {
    ...(value.label !== undefined ? { label: cleanText(value.label, 140) } : {}),
    ...(value.type !== undefined ? { type: cleanText(value.type, 100) } : {}),
    ...(value.detail !== undefined ? { detail: cleanLongText(value.detail, 1200) } : {}),
    ...(value.url !== undefined ? { url: cleanText(value.url, 1000) } : {}),
  }
}

function parseVariantPatch(value: unknown): Partial<PacketRecord["variants"][AudienceMode]> {
  if (!isRecord(value)) {
    throw new ApiValidationError("Invalid variant patch.")
  }

  return {
    ...(value.format !== undefined ? { format: cleanText(value.format, 100) } : {}),
    ...(value.hook !== undefined ? { hook: cleanLongText(value.hook, 700) } : {}),
    ...(value.body !== undefined ? { body: cleanLongText(value.body, 1800) } : {}),
    ...(value.cta !== undefined ? { cta: cleanLongText(value.cta, 700) } : {}),
  }
}

function parsePacketPatch(value: unknown): PacketPatch {
  if (!isRecord(value)) {
    throw new ApiValidationError("Invalid packet patch.")
  }

  return {
    ...(value.title !== undefined ? { title: cleanText(value.title, 180) || "Untitled packet" } : {}),
    ...(value.pulse !== undefined ? { pulse: cleanText(value.pulse, 160) } : {}),
    ...(value.intakeFormat !== undefined ? { intakeFormat: cleanText(value.intakeFormat, 80) } : {}),
    ...(value.sourceLink !== undefined ? { sourceLink: cleanText(value.sourceLink, 1000) } : {}),
    ...(value.channel !== undefined ? { channel: cleanText(value.channel, 120) } : {}),
    ...(value.region !== undefined ? { region: cleanText(value.region, 120) } : {}),
    ...(value.urgency !== undefined
      ? { urgency: requiredEnum(value.urgency, urgencyLevels, "urgency") as PacketUrgency }
      : {}),
    ...(value.confidence !== undefined
      ? { confidence: requiredEnum(value.confidence, confidenceLevels, "confidence") as PacketConfidence }
      : {}),
    ...(value.leadAudience !== undefined
      ? { leadAudience: requiredEnum(value.leadAudience, audienceModes, "lead audience") as AudienceMode }
      : {}),
    ...(value.claim !== undefined ? { claim: cleanLongText(value.claim, 1200) } : {}),
    ...(value.truth !== undefined ? { truth: cleanLongText(value.truth, 1600) } : {}),
    ...(value.risk !== undefined ? { risk: cleanLongText(value.risk, 1600) } : {}),
    ...(value.status !== undefined
      ? { status: requiredEnum(value.status, statuses, "status") as PacketStatus }
      : {}),
    ...(value.reviewNotes !== undefined ? { reviewNotes: cleanLongText(value.reviewNotes, 2500) } : {}),
  }
}

export function parsePacketCreateBody(value: unknown): PacketRecord {
  if (!isRecord(value)) {
    throw new ApiValidationError("Invalid packet payload.")
  }

  const title = cleanText(value.title, 180)
  const claim = cleanLongText(value.claim, 1200)

  if (!title && !claim) {
    throw new ApiValidationError("Packet title or claim is required.")
  }

  const rawSignals = Array.isArray(value.signals) ? value.signals.slice(0, maxSignals) : undefined

  return createPacketRecord({
    title,
    claim,
    pulse: cleanText(value.pulse, 160),
    intakeFormat: cleanText(value.intakeFormat, 80),
    sourceLink: cleanText(value.sourceLink, 1000),
    channel: cleanText(value.channel, 120),
    region: cleanText(value.region, 120),
    urgency: optionalEnum(value.urgency, urgencyLevels, "urgency"),
    confidence: optionalEnum(value.confidence, confidenceLevels, "confidence"),
    leadAudience: optionalEnum(value.leadAudience, audienceModes, "lead audience"),
    signals: rawSignals?.map((signal) => parseSignal(signal)),
  })
}

export function parsePatchBody(value: unknown): ValidatedPatchBody {
  if (!isRecord(value) || typeof value.type !== "string") {
    throw new ApiValidationError("Invalid patch payload.")
  }

  switch (value.type) {
    case "updatePacket":
      return { type: value.type, patch: parsePacketPatch(value.patch) }
    case "addSignal":
      return {
        type: value.type,
        signal: parseSignal(value.signal),
      }
    case "updateSignal":
      return { type: value.type, signalId: cleanId(value.signalId), patch: parsePatchSignal(value.patch) }
    case "removeSignal":
      return { type: value.type, signalId: cleanId(value.signalId) }
    case "addSource":
      return {
        type: value.type,
        source: parseSource(value.source),
      }
    case "updateSource":
      return { type: value.type, sourceId: cleanId(value.sourceId), patch: parsePatchSource(value.patch) }
    case "removeSource":
      return { type: value.type, sourceId: cleanId(value.sourceId) }
    case "updateVariant":
      return {
        type: value.type,
        audience: requiredEnum(value.audience, audienceModes, "audience"),
        patch: parseVariantPatch(value.patch),
      }
    case "toggleReviewItem":
      return { type: value.type, itemId: cleanId(value.itemId) }
    case "setReviewNotes":
      return { type: value.type, notes: cleanLongText(value.notes, 2500) }
    case "setStatus":
      return { type: value.type, status: requiredEnum(value.status, statuses, "status") }
    default:
      throw new ApiValidationError("Unsupported patch type.")
  }
}
