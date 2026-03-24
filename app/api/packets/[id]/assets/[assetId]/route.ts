import { NextResponse } from "next/server"

import { deletePacketAsset } from "@/lib/server/packet-assets"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; assetId: string }> },
) {
  try {
    const { id, assetId } = await params
    const asset = await deletePacketAsset(id, assetId)

    if (!asset) {
      return NextResponse.json({ message: "Asset not found" }, { status: 404 })
    }

    return NextResponse.json({ id: asset.id })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not remove the packet asset."

    console.error("Packet asset delete failed", error)
    return NextResponse.json({ message }, { status: 500 })
  }
}
