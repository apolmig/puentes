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
  ) => Promise<void>
  uploadAsset: (id: string, input: { file: File; label?: string }) => Promise<void>
  removeAsset: (id: string, assetId: string) => Promise<void>
  addSignal: (id: string) => Promise<void>
  updateSignal: (id: string, signalId: string, patch: Partial<PacketSignal>) => Promise<void>
  removeSignal: (id: string, signalId: string) => Promise<void>
  addSource: (id: string) => Promise<void>
  updateSource: (id: string, sourceId: string, patch: Partial<PacketSource>) => Promise<void>
  removeSource: (id: string, sourceId: string) => Promise<void>
  updateVariant: (
    id: string,
    audience: AudienceMode,
    patch: Partial<PacketRecord["variants"][AudienceMode]>,
  ) => Promise<void>
  toggleReviewItem: (id: string, itemId: string) => Promise<void>
  setReviewNotes: (id: string, notes: string) => Promise<void>
  setStatus: (id: string, status: PacketStatus) => Promise<void>
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

function replacePacketById(packets: PacketRecord[], nextPacket: PacketRecord) {
  if (!packets.some((packet) => packet.id === nextPacket.id)) {
    return [nextPacket, ...packets]
  }

  return packets.map((packet) => (packet.id === nextPacket.id ? nextPacket : packet))
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

  const commitPacketPatch = React.useCallback(async (
    id: string,
    body: object,
    optimisticUpdater: (packet: PacketRecord) => PacketRecord,
  ) => {
    let previousPacket: PacketRecord | undefined

    setPackets((current) => {
      previousPacket = current.find((packet) => packet.id === id)
      return updatePacketById(current, id, optimisticUpdater)
    })

    try {
      const packet = await requestJson<PacketRecord>(`/api/packets/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      setPackets((current) => replacePacketById(current, packet))
    } catch (error) {
      console.error("Packet save failed", error)

      const rollbackPacket = previousPacket

      if (rollbackPacket) {
        setPackets((current) => replacePacketById(current, rollbackPacket))
      }
    }
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
      const packet = await requestJson<PacketRecord>("/api/packets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createPacketRecord(input)),
      })

      setPackets((current) => replacePacketById(current, packet))
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
    ) =>
      commitPacketPatch(
        id,
        {
          type: "updatePacket",
          patch,
        },
        (packet) => ({
          ...packet,
          ...patch,
        }),
      )
    ,
    [commitPacketPatch],
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
    let previousPacket: PacketRecord | undefined

    setPackets((current) =>
      updatePacketById(current, id, (packet) => {
        previousPacket = packet

        return {
          ...packet,
          assets: packet.assets.filter((asset) => asset.id !== assetId),
        }
      }),
    )

    const response = await fetch(`/api/packets/${id}/assets/${assetId}`, {
      method: "DELETE",
      headers: buildDeploymentHeaders(),
    })

    if (!response.ok) {
      const rollbackPacket = previousPacket

      if (rollbackPacket) {
        setPackets((current) => replacePacketById(current, rollbackPacket))
      }

      throw new Error(`Failed to remove asset ${assetId}`)
    }
  }, [])

  const addSignal = React.useCallback((id: string) => {
    const signal = createSignal()

    return commitPacketPatch(
      id,
      {
        type: "addSignal",
        signal,
      },
      (packet) => ({
        ...packet,
        signals: [...packet.signals, signal],
      }),
    )
  }, [commitPacketPatch])

  const updateSignal = React.useCallback(
    (id: string, signalId: string, patch: Partial<PacketSignal>) =>
      commitPacketPatch(
        id,
        {
          type: "updateSignal",
          signalId,
          patch,
        },
        (packet) => ({
          ...packet,
          signals: packet.signals.map((signal) =>
            signal.id === signalId ? { ...signal, ...patch } : signal,
          ),
        }),
      )
    ,
    [commitPacketPatch],
  )

  const removeSignal = React.useCallback((id: string, signalId: string) => {
    return commitPacketPatch(
      id,
      {
        type: "removeSignal",
        signalId,
      },
      (packet) => ({
        ...packet,
        signals: packet.signals.filter((signal) => signal.id !== signalId),
      }),
    )
  }, [commitPacketPatch])

  const addSource = React.useCallback((id: string) => {
    const source = createSource()

    return commitPacketPatch(
      id,
      {
        type: "addSource",
        source,
      },
      (packet) => ({
        ...packet,
        sources: [...packet.sources, source],
      }),
    )
  }, [commitPacketPatch])

  const updateSource = React.useCallback(
    (id: string, sourceId: string, patch: Partial<PacketSource>) =>
      commitPacketPatch(
        id,
        {
          type: "updateSource",
          sourceId,
          patch,
        },
        (packet) => ({
          ...packet,
          sources: packet.sources.map((source) =>
            source.id === sourceId ? { ...source, ...patch } : source,
          ),
        }),
      )
    ,
    [commitPacketPatch],
  )

  const removeSource = React.useCallback((id: string, sourceId: string) => {
    return commitPacketPatch(
      id,
      {
        type: "removeSource",
        sourceId,
      },
      (packet) => ({
        ...packet,
        sources:
          packet.sources.length > 1
            ? packet.sources.filter((source) => source.id !== sourceId)
            : packet.sources,
      }),
    )
  }, [commitPacketPatch])

  const updateVariant = React.useCallback(
    (
      id: string,
      audience: AudienceMode,
      patch: Partial<PacketRecord["variants"][AudienceMode]>,
    ) =>
      commitPacketPatch(
        id,
        {
          type: "updateVariant",
          audience,
          patch,
        },
        (packet) => ({
          ...packet,
          variants: {
            ...packet.variants,
            [audience]: {
              ...packet.variants[audience],
              ...patch,
            },
          },
        }),
      )
    ,
    [commitPacketPatch],
  )

  const toggleReviewItem = React.useCallback((id: string, itemId: string) => {
    return commitPacketPatch(
      id,
      {
        type: "toggleReviewItem",
        itemId,
      },
      (packet) => ({
        ...packet,
        reviewChecklist: packet.reviewChecklist.map((item) =>
          item.id === itemId ? { ...item, checked: !item.checked } : item,
        ),
      }),
    )
  }, [commitPacketPatch])

  const setReviewNotes = React.useCallback((id: string, notes: string) => {
    return commitPacketPatch(
      id,
      {
        type: "setReviewNotes",
        notes,
      },
      (packet) => ({
        ...packet,
        reviewNotes: notes,
      }),
    )
  }, [commitPacketPatch])

  const setStatus = React.useCallback((id: string, status: PacketStatus) => {
    return commitPacketPatch(
      id,
      {
        type: "setStatus",
        status,
      },
      (packet) => ({
        ...packet,
        status,
      }),
    )
  }, [commitPacketPatch])

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
