import { NextResponse } from "next/server"

import type {
  AudienceMode,
  PacketRecord,
  PacketSignal,
  PacketSource,
  PacketStatus,
} from "@/lib/bridgebeat"
import {
  addSignalInDb,
  addSourceInDb,
  getPacketFromDb,
  removeSignalInDb,
  removeSourceInDb,
  setReviewNotesInDb,
  setStatusInDb,
  toggleReviewItemInDb,
  updatePacketInDb,
  updateSignalInDb,
  updateSourceInDb,
  updateVariantInDb,
} from "@/lib/server/bridgebeat-db"

type PatchBody =
  | {
      type: "updatePacket"
      patch: Partial<
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const packet = await getPacketFromDb(id)

  if (!packet) {
    return NextResponse.json({ message: "Packet not found" }, { status: 404 })
  }

  return NextResponse.json(packet)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = (await request.json()) as PatchBody
  const existing = await getPacketFromDb(id)

  if (!existing) {
    return NextResponse.json({ message: "Packet not found" }, { status: 404 })
  }

  let packet

  switch (body.type) {
    case "updatePacket":
      packet = await updatePacketInDb(id, body.patch)
      break
    case "addSignal":
      packet = await addSignalInDb(id, body.signal)
      break
    case "updateSignal":
      packet = await updateSignalInDb(id, body.signalId, body.patch)
      break
    case "removeSignal":
      packet = await removeSignalInDb(id, body.signalId)
      break
    case "addSource":
      packet = await addSourceInDb(id, body.source)
      break
    case "updateSource":
      packet = await updateSourceInDb(id, body.sourceId, body.patch)
      break
    case "removeSource":
      packet = await removeSourceInDb(id, body.sourceId)
      break
    case "updateVariant":
      packet = await updateVariantInDb(id, body.audience, body.patch)
      break
    case "toggleReviewItem":
      packet = await toggleReviewItemInDb(id, body.itemId)
      break
    case "setReviewNotes":
      packet = await setReviewNotesInDb(id, body.notes)
      break
    case "setStatus":
      packet = await setStatusInDb(id, body.status)
      break
    default:
      return NextResponse.json({ message: "Unsupported patch type" }, { status: 400 })
  }

  return NextResponse.json(packet)
}
