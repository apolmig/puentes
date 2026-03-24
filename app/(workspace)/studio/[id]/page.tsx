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
  audienceMeta,
  audienceModes,
  buildAudienceResponsePack,
  buildVariantDraft,
  formatBytes,
} from "@/lib/bridgebeat"

function VariantField({
  label,
  value,
  onChange,
  rows = 1,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
        {label}
      </label>
      {rows === 1 ? (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
        />
      ) : (
        <textarea
          rows={rows}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-4 py-3 text-sm leading-7 outline-none transition focus:border-[color:var(--accent)]"
        />
      )}
    </div>
  )
}

export default function StudioPage() {
  const params = useParams()
  const packetId = typeof params.id === "string" ? params.id : params.id?.[0] ?? ""
  const { hydrated, getPacket, updateVariant } = usePacketStore()
  const [audience, setAudience] = React.useState<AudienceMode>("creator")
  const [feedback, setFeedback] = React.useState("")
  const packet = getPacket(packetId)

  React.useEffect(() => {
    if (packet) {
      setAudience(packet.leadAudience)
    }
  }, [packet])

  if (!hydrated) {
    return <Surface>Loading studio...</Surface>
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
  const variant = activePacket.variants[audience]
  const responsePack = buildAudienceResponsePack(activePacket, audience)

  function regenerateLane() {
    updateVariant(activePacket.id, audience, buildVariantDraft(activePacket, audience))
    setFeedback(`Regenerated the ${audienceMeta[audience].label} lane from the packet.`)
  }

  function syncAllLanes() {
    for (const mode of audienceModes) {
      updateVariant(activePacket.id, mode, buildVariantDraft(activePacket, mode))
    }

    setFeedback("Synced all audience lanes from the current packet truth, risk, and routing.")
  }

  async function copyCard(content: string) {
    await navigator.clipboard.writeText(content)
    setFeedback("Copied response card.")
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Studio"
        title={`Remix ${activePacket.title}`}
        description="Turn one verified packet into creator, educator, and collective outputs without rewriting the truth from scratch."
        actions={
          <>
            <QuickLink href={`/packets/${activePacket.id}`} label="Packet Editor" />
            <QuickLink href={`/review/${activePacket.id}`} label="Review Gate" />
            <QuickLink href={`/exports/${activePacket.id}`} label="Exports" />
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
                ? `rounded-full px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.18em] ${audienceMeta[mode].accentClass}`
                : "rounded-full border border-black/10 bg-white/75 px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--ink)]"
            }
          >
            {audienceMeta[mode].label}
          </button>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.54fr_0.46fr]">
        <Surface className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={activePacket.status} />
              <UrgencyPill urgency={activePacket.urgency} />
              <ConfidencePill confidence={activePacket.confidence} />
              <AudiencePill audience={audience} />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={regenerateLane}
                className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white"
              >
                Regenerate lane
              </button>
              <button
                type="button"
                onClick={syncAllLanes}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--ink)]"
              >
                Sync all lanes
              </button>
            </div>
          </div>
          <p className="text-sm text-[color:var(--muted)]">{audienceMeta[audience].caption}</p>

          <VariantField
            label="Format"
            value={variant.format}
            onChange={(value) => updateVariant(activePacket.id, audience, { format: value })}
          />
          <VariantField
            label="Hook"
            value={variant.hook}
            onChange={(value) => updateVariant(activePacket.id, audience, { hook: value })}
            rows={3}
          />
          <VariantField
            label="Body"
            value={variant.body}
            onChange={(value) => updateVariant(activePacket.id, audience, { body: value })}
            rows={5}
          />
          <VariantField
            label="CTA"
            value={variant.cta}
            onChange={(value) => updateVariant(activePacket.id, audience, { cta: value })}
            rows={3}
          />

          {feedback ? <p className="text-sm leading-7 text-[color:var(--muted)]">{feedback}</p> : null}
        </Surface>

        <div className="space-y-6">
          <Surface className="space-y-4 bg-[#0f1726] text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/56">
              Live preview
            </p>
            <p className="text-sm uppercase tracking-[0.2em] text-white/56">{variant.format}</p>
            <h2 className="text-3xl font-semibold tracking-[-0.04em]">{variant.hook}</h2>
            <p className="text-base leading-8 text-white/76">{variant.body}</p>
            <div className="border-t border-white/12 pt-4 text-sm leading-7 text-white/82">
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

          <Surface className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Packet truth
            </p>
            <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
              {activePacket.channel} / {activePacket.region}
            </p>
            <p className="text-lg font-semibold tracking-[-0.03em]">
              {activePacket.truth || "No verified truth yet."}
            </p>
            <p className="text-sm leading-7 text-[color:var(--muted)]">
              {activePacket.risk || "No spread analysis yet."}
            </p>
          </Surface>

          {activePacket.assets.length > 0 ? (
            <Surface className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Evidence locker
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
              Source ladder snapshot
            </p>
            <div className="space-y-3">
              {activePacket.sources.map((source) => (
                <div
                  key={source.id}
                  className="rounded-[1.4rem] border border-black/10 bg-white/70 p-4"
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    {source.label}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                    {source.detail || source.url || "Add source detail in the packet editor."}
                  </p>
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  )
}
