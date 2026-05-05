import { NextResponse } from "next/server"

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
import {
  ApiValidationError,
  parsePatchBody,
} from "@/lib/server/packet-api-validation"

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
  try {
    const { id } = await params
    const body = parsePatchBody(await request.json())
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
    }

    return NextResponse.json(packet)
  } catch (error) {
    if (error instanceof ApiValidationError || error instanceof SyntaxError) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    console.error("Packet patch failed", error)
    return NextResponse.json({ message: "Could not update packet" }, { status: 500 })
  }
}
