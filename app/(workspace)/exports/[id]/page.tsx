"use client"

import { useParams } from "next/navigation"
import * as React from "react"

import { usePacketStore } from "@/components/bridgebeat/packet-store-provider"
import {
  AudiencePill,
  ConfidencePill,
  PageHeader,
  QuickLink,
  StatusPill,
  Surface,
  UrgencyPill,
} from "@/components/bridgebeat/workspace-primitives"
import {
  type AudienceMode,
  audienceModes,
  buildAudienceResponsePack,
  buildExportText,
  formatBytes,
} from "@/lib/bridgebeat"

export default function ExportsPage() {
  const params = useParams()
  const packetId = typeof params.id === "string" ? params.id : params.id?.[0] ?? ""
  const { hydrated, getPacket } = usePacketStore()
  const [audience, setAudience] = React.useState<AudienceMode>("creator")
  const [feedback, setFeedback] = React.useState("")
  const packet = getPacket(packetId)

  if (!hydrated) {
    return <Surface>Loading exports...</Surface>
  }

  if (!packet) {
    return (
      <Surface className="space-y-4">
        <p className="text-2xl font-semibold tracking-[-0.04em]">Packet not found.</p>
        <QuickLink href="/inbox" label="Back to Inbox" />
      </Surface>
    )
  }

  const activePacket = packet
  const exportText = buildExportText(activePacket, audience)
  const variant = activePacket.variants[audience]
  const responsePack = buildAudienceResponsePack(activePacket, audience)
  const exportEnabled = activePacket.status === "approved"

  async function copyToClipboard() {
    if (!exportEnabled) {
      setFeedback("Approve the packet in review before copying exports.")
      return
    }

    await navigator.clipboard.writeText(exportText)
    setFeedback("Copied export text.")
  }

  async function copyCard(content: string) {
    if (!exportEnabled) {
      setFeedback("Approve the packet in review before copying response cards.")
      return
    }

    await navigator.clipboard.writeText(content)
    setFeedback("Copied response card.")
  }

  function downloadText() {
    if (!exportEnabled) {
      setFeedback("Approve the packet in review before downloading exports.")
      return
    }

    const blob = new Blob([exportText], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${activePacket.title.toLowerCase().replace(/\s+/g, "-")}-${audience}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
    setFeedback("Downloaded export file.")
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Exports"
        title={`Ship ${activePacket.title}`}
        description="Copy or download a share-safe handoff. Export actions unlock only after review approves the packet."
        actions={
          <>
            <QuickLink href={`/packets/${activePacket.id}`} label="Packet Editor" />
            <QuickLink href={`/studio/${activePacket.id}`} label="Studio" />
            <QuickLink href={`/review/${activePacket.id}`} label="Review Gate" />
          </>
        }
      />

      <div className="flex flex-wrap gap-3">
        {audienceModes.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setAudience(mode)}
            className={
              audience === mode
                ? "rounded-full bg-[color:var(--ink)] px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.18em] text-white"
                : "rounded-full border border-black/10 bg-white/75 px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--ink)]"
            }
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.42fr_0.58fr]">
        <div className="space-y-6">
          <Surface className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={activePacket.status} />
              <UrgencyPill urgency={activePacket.urgency} />
              <ConfidencePill confidence={activePacket.confidence} />
              <AudiencePill audience={activePacket.leadAudience} />
            </div>
            <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
              {activePacket.channel} / {activePacket.region}
            </p>
            <p className="text-3xl font-semibold tracking-[-0.05em]">{variant.hook}</p>
            <p className="text-base leading-8 text-[color:var(--muted)]">{variant.body}</p>
            <div className="border-t border-black/10 pt-4 text-sm leading-7 text-[color:var(--muted)]">
              {variant.cta}
            </div>
          </Surface>

          <Surface className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Response pack
            </p>
            <div className="space-y-3">
              {responsePack.map((card) => (
                <div
                  key={card.label}
                  className="rounded-[1.4rem] border border-black/10 bg-white/70 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      {card.label}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        void copyCard(card.content)
                      }}
                      className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{card.content}</p>
                </div>
              ))}
            </div>
          </Surface>

          {activePacket.assets.length > 0 ? (
            <Surface className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Attached evidence
              </p>
              <div className="space-y-3">
                {activePacket.assets.slice(0, 3).map((asset) => (
                  <div
                    key={asset.id}
                    className="rounded-[1.4rem] border border-black/10 bg-white/70 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold tracking-[-0.02em]">{asset.label}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                          {asset.kind} / {formatBytes(asset.size)}
                        </p>
                      </div>
                      <a
                        href={asset.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--ink)]"
                      >
                        Open
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </Surface>
          ) : null}

          <Surface className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Export actions
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={copyToClipboard}
                className={
                  exportEnabled
                    ? "rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white"
                    : "cursor-not-allowed rounded-full bg-black/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black/40"
                }
              >
                Copy text
              </button>
              <button
                type="button"
                onClick={downloadText}
                className={
                  exportEnabled
                    ? "rounded-full border border-black/10 bg-white/80 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--ink)]"
                    : "cursor-not-allowed rounded-full border border-black/10 bg-white/40 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black/40"
                }
              >
                Download txt
              </button>
            </div>
            <p className="text-sm leading-7 text-[color:var(--muted)]">
              {exportEnabled
                ? "This packet is approved, so the handoff can be copied or downloaded."
                : "Exports are previewable now, but review approval is required before copy or download."}
            </p>
            {feedback ? <p className="text-sm text-[color:var(--muted)]">{feedback}</p> : null}
          </Surface>
        </div>

        <Surface className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
            Export bundle preview
          </p>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-[1.6rem] border border-black/10 bg-white/80 p-5 text-sm leading-7 text-[color:var(--ink)]">
            {exportText}
          </pre>
        </Surface>
      </div>
    </div>
  )
}
