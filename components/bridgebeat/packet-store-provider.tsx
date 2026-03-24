"use client"

import * as React from "react"

import {
  type AudienceMode,
  type PacketAsset,
  type PacketRecord,
  type PacketSignal,
  type PacketSource,
  type PacketStatus,
  createPacketRecord,
  createSignal,
  createSource,
} from "@/lib/bridgebeat"

type PacketStoreValue = {
  hydrated: boolean
  packets: PacketRecord[]
  getPacket: (id: string) => PacketRecord | undefined
  createPacket: (input: {
    title: string
    claim: string
    pulse?: string
    intakeFormat?: string
    sourceLink?: string
    channel?: string
    region?: string
    urgency?: PacketRecord["urgency"]
    confidence?: PacketRecord["confidence"]
    leadAudience?: AudienceMode
    signals?: PacketSignal[]
  }) => Promise<string>
  updatePacket: (
    id: string,
    patch: Partial<
      Omit<PacketRecord, "id" | "signals" | "assets" | "sources" | "variants" | "reviewChecklist">
    >,
  ) => void
  uploadAsset: (id: string, input: { file: File; label?: string }) => Promise<void>
  removeAsset: (id: string, assetId: string) => Promise<void>
  addSignal: (id: string) => void
  updateSignal: (id: string, signalId: string, patch: Partial<PacketSignal>) => void
  removeSignal: (id: string, signalId: string) => void
  addSource: (id: string) => void
  updateSource: (id: string, sourceId: string, patch: Partial<PacketSource>) => void
  removeSource: (id: string, sourceId: string) => void
  updateVariant: (
    id: string,
    audience: AudienceMode,
    patch: Partial<PacketRecord["variants"][AudienceMode]>,
  ) => void
  toggleReviewItem: (id: string, itemId: string) => void
  setReviewNotes: (id: string, notes: string) => void
  setStatus: (id: string, status: PacketStatus) => void
}

const PacketStoreContext = React.createContext<PacketStoreValue | null>(null)

function stampPacket(packet: PacketRecord): PacketRecord {
  return {
    ...packet,
    updatedAt: new Date().toISOString(),
  }
}

function updatePacketById(
  packets: PacketRecord[],
  id: string,
  updater: (packet: PacketRecord) => PacketRecord,
) {
  return packets.map((packet) => (packet.id === id ? stampPacket(updater(packet)) : packet))
}

function buildDeploymentHeaders(headers?: HeadersInit) {
  const nextHeaders = new Headers(headers)
  const deploymentId = process.env.NEXT_DEPLOYMENT_ID

  if (deploymentId) {
    nextHeaders.set("x-deployment-id", deploymentId)
  }

  return nextHeaders
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: buildDeploymentHeaders(init?.headers),
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}

export function PacketStoreProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = React.useState(false)
  const [packets, setPackets] = React.useState<PacketRecord[]>([])

  React.useEffect(() => {
    let active = true

    void requestJson<PacketRecord[]>("/api/packets")
      .then((nextPackets) => {
        if (active) {
          setPackets(nextPackets)
        }
      })
      .finally(() => {
        if (active) {
          setHydrated(true)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const getPacket = React.useCallback(
    (id: string) => packets.find((packet) => packet.id === id),
    [packets],
  )

  const patchPacketRequest = React.useCallback((id: string, body: object) => {
    void fetch(`/api/packets/${id}`, {
      method: "PATCH",
      headers: buildDeploymentHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(body),
    })
  }, [])

  const createPacket = React.useCallback(
    async (input: {
      title: string
      claim: string
      pulse?: string
      intakeFormat?: string
      sourceLink?: string
      channel?: string
      region?: string
      urgency?: PacketRecord["urgency"]
      confidence?: PacketRecord["confidence"]
      leadAudience?: AudienceMode
      signals?: PacketSignal[]
    }) => {
      const packet = createPacketRecord(input)
      setPackets((current) => [packet, ...current])
      await requestJson<PacketRecord>("/api/packets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(packet),
      })
      return packet.id
    },
    [],
  )

  const updatePacket = React.useCallback(
    (
      id: string,
      patch: Partial<
        Omit<
          PacketRecord,
          "id" | "signals" | "assets" | "sources" | "variants" | "reviewChecklist"
        >
      >,
    ) => {
      setPackets((current) =>
        updatePacketById(current, id, (packet) => ({
          ...packet,
          ...patch,
        })),
      )
      patchPacketRequest(id, {
        type: "updatePacket",
        patch,
      })
    },
    [patchPacketRequest],
  )

  const uploadAsset = React.useCallback(
    async (id: string, input: { file: File; label?: string }) => {
      const formData = new FormData()
      formData.append("file", input.file)

      if (input.label?.trim()) {
        formData.append("label", input.label.trim())
      }

      const asset = await requestJson<PacketAsset>(`/api/packets/${id}/assets`, {
        method: "POST",
        body: formData,
      })

      setPackets((current) =>
        updatePacketById(current, id, (packet) => ({
          ...packet,
          assets: [...packet.assets, asset],
        })),
      )
    },
    [],
  )

  const removeAsset = React.useCallback(async (id: string, assetId: string) => {
    setPackets((current) =>
      updatePacketById(current, id, (packet) => ({
        ...packet,
        assets: packet.assets.filter((asset) => asset.id !== assetId),
      })),
    )

    const response = await fetch(`/api/packets/${id}/assets/${assetId}`, {
      method: "DELETE",
      headers: buildDeploymentHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to remove asset ${assetId}`)
    }
  }, [])

  const addSignal = React.useCallback((id: string) => {
    const signal = createSignal()

    setPackets((current) =>
      updatePacketById(current, id, (packet) => ({
        ...packet,
        signals: [...packet.signals, signal],
      })),
    )
    patchPacketRequest(id, {
      type: "addSignal",
      signal,
    })
  }, [patchPacketRequest])

  const updateSignal = React.useCallback(
    (id: string, signalId: string, patch: Partial<PacketSignal>) => {
      setPackets((current) =>
        updatePacketById(current, id, (packet) => ({
          ...packet,
          signals: packet.signals.map((signal) =>
            signal.id === signalId ? { ...signal, ...patch } : signal,
          ),
        })),
      )
      patchPacketRequest(id, {
        type: "updateSignal",
        signalId,
        patch,
      })
    },
    [patchPacketRequest],
  )

  const removeSignal = React.useCallback((id: string, signalId: string) => {
    setPackets((current) =>
      updatePacketById(current, id, (packet) => ({
        ...packet,
        signals: packet.signals.filter((signal) => signal.id !== signalId),
      })),
    )
    patchPacketRequest(id, {
      type: "removeSignal",
      signalId,
    })
  }, [patchPacketRequest])

  const addSource = React.useCallback((id: string) => {
    const source = createSource()

    setPackets((current) =>
      updatePacketById(current, id, (packet) => ({
        ...packet,
        sources: [...packet.sources, source],
      })),
    )
    patchPacketRequest(id, {
      type: "addSource",
      source,
    })
  }, [patchPacketRequest])

  const updateSource = React.useCallback(
    (id: string, sourceId: string, patch: Partial<PacketSource>) => {
      setPackets((current) =>
        updatePacketById(current, id, (packet) => ({
          ...packet,
          sources: packet.sources.map((source) =>
            source.id === sourceId ? { ...source, ...patch } : source,
          ),
        })),
      )
      patchPacketRequest(id, {
        type: "updateSource",
        sourceId,
        patch,
      })
    },
    [patchPacketRequest],
  )

  const removeSource = React.useCallback((id: string, sourceId: string) => {
    setPackets((current) =>
      updatePacketById(current, id, (packet) => ({
        ...packet,
        sources:
          packet.sources.length > 1
            ? packet.sources.filter((source) => source.id !== sourceId)
            : packet.sources,
      })),
    )
    patchPacketRequest(id, {
      type: "removeSource",
      sourceId,
    })
  }, [patchPacketRequest])

  const updateVariant = React.useCallback(
    (
      id: string,
      audience: AudienceMode,
      patch: Partial<PacketRecord["variants"][AudienceMode]>,
    ) => {
      setPackets((current) =>
        updatePacketById(current, id, (packet) => ({
          ...packet,
          variants: {
            ...packet.variants,
            [audience]: {
              ...packet.variants[audience],
              ...patch,
            },
          },
        })),
      )
      patchPacketRequest(id, {
        type: "updateVariant",
        audience,
        patch,
      })
    },
    [patchPacketRequest],
  )

  const toggleReviewItem = React.useCallback((id: string, itemId: string) => {
    setPackets((current) =>
      updatePacketById(current, id, (packet) => ({
        ...packet,
        reviewChecklist: packet.reviewChecklist.map((item) =>
          item.id === itemId ? { ...item, checked: !item.checked } : item,
        ),
      })),
    )
    patchPacketRequest(id, {
      type: "toggleReviewItem",
      itemId,
    })
  }, [patchPacketRequest])

  const setReviewNotes = React.useCallback((id: string, notes: string) => {
    setPackets((current) =>
      updatePacketById(current, id, (packet) => ({
        ...packet,
        reviewNotes: notes,
      })),
    )
    patchPacketRequest(id, {
      type: "setReviewNotes",
      notes,
    })
  }, [patchPacketRequest])

  const setStatus = React.useCallback((id: string, status: PacketStatus) => {
    setPackets((current) =>
      updatePacketById(current, id, (packet) => ({
        ...packet,
        status,
      })),
    )
    patchPacketRequest(id, {
      type: "setStatus",
      status,
    })
  }, [patchPacketRequest])

  const value = React.useMemo<PacketStoreValue>(
    () => ({
      hydrated,
      packets,
      getPacket,
      createPacket,
      updatePacket,
      uploadAsset,
      removeAsset,
      addSignal,
      updateSignal,
      removeSignal,
      addSource,
      updateSource,
      removeSource,
      updateVariant,
      toggleReviewItem,
      setReviewNotes,
      setStatus,
    }),
    [
      hydrated,
      packets,
      getPacket,
      createPacket,
      updatePacket,
      uploadAsset,
      removeAsset,
      addSignal,
      updateSignal,
      removeSignal,
      addSource,
      updateSource,
      removeSource,
      updateVariant,
      toggleReviewItem,
      setReviewNotes,
      setStatus,
    ],
  )

  return <PacketStoreContext.Provider value={value}>{children}</PacketStoreContext.Provider>
}

export function usePacketStore() {
  const context = React.useContext(PacketStoreContext)

  if (!context) {
    throw new Error("usePacketStore must be used within PacketStoreProvider")
  }

  return context
}
