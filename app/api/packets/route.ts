import { NextResponse } from "next/server"

import { createPacketInDb, listPacketsFromDb } from "@/lib/server/bridgebeat-db"
import {
  ApiValidationError,
  parsePacketCreateBody,
} from "@/lib/server/packet-api-validation"

export async function GET() {
  const packets = await listPacketsFromDb()
  return NextResponse.json(packets)
}

export async function POST(request: Request) {
  try {
    const packet = parsePacketCreateBody(await request.json())
    const created = await createPacketInDb(packet)

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof ApiValidationError || error instanceof SyntaxError) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    console.error("Packet create failed", error)
    return NextResponse.json({ message: "Could not create packet" }, { status: 500 })
  }
}
