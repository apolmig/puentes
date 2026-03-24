import { NextResponse } from "next/server"

import type { PacketRecord } from "@/lib/bridgebeat"
import { createPacketInDb, listPacketsFromDb } from "@/lib/server/bridgebeat-db"

export async function GET() {
  const packets = await listPacketsFromDb()
  return NextResponse.json(packets)
}

export async function POST(request: Request) {
  const packet = (await request.json()) as PacketRecord
  const created = await createPacketInDb(packet)
  return NextResponse.json(created, { status: 201 })
}
