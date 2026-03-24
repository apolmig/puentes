import { NextResponse } from "next/server"

import { getPacketFromDb } from "@/lib/server/bridgebeat-db"
import { storePacketAsset } from "@/lib/server/packet-assets"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const packet = await getPacketFromDb(id)

  if (!packet) {
    return NextResponse.json({ message: "Packet not found" }, { status: 404 })
  }

  const formData = await request.formData()
  const file = formData.get("file")
  const label = formData.get("label")

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Missing upload file" }, { status: 400 })
  }

  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json(
      { message: "Upload exceeds the 25 MB local size limit" },
      { status: 413 },
    )
  }

  const asset = await storePacketAsset({
    packetId: id,
    file,
    label: typeof label === "string" ? label : undefined,
  })

  return NextResponse.json(asset, { status: 201 })
}
