"use client"

import Link from "next/link"
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
  type PacketConfidence,
  type PacketUrgency,
  audienceMeta,
  audienceModes,
  confidenceLevels,
  confidenceMeta,
  formatBytes,
  isReviewReady,
  urgencyLevels,
  urgencyMeta,
} from "@/lib/bridgebeat"

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
        {label}
      </label>
      {children}
    </div>
  )
}

const signalKinds = ["manual note", "link", "screenshot", "video clip", "audio rumor"]

function PacketAssetCard({
  asset,
  onRemove,
}: {
  asset: {
    id: string
    kind: string
    label: string
    fileName: string
    mimeType: string
    size: number
    url: string
  }
  onRemove: () => void
}) {
  return (
    <div className="space-y-4 rounded-[1.6rem] border border-black/10 bg-white/80 p-5">
      {asset.kind === "image" ? (
        <div
          className="h-44 rounded-[1.2rem] bg-cover bg-center"
          style={{ backgroundImage: `url(${asset.url})` }}
        />
      ) : asset.kind === "video" ? (
        <video controls src={asset.url} className="h-44 w-full rounded-[1.2rem] bg-black/90" />
      ) : asset.kind === "audio" ? (
        <div className="rounded-[1.2rem] bg-[#0f1726] p-4 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-white/56">Audio note</p>
          <audio controls src={asset.url} className="mt-4 w-full" />
        </div>
      ) : (
        <div className="flex h-44 items-center justify-center rounded-[1.2rem] bg-[#fff9f0] text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
          File upload
        </div>
      )}

      <div className="space-y-2">
        <p className="text-lg font-semibold tracking-[-0.03em]">{asset.label}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
          {asset.kind} / {asset.fileName} / {formatBytes(asset.size)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={asset.url}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-[color:var(--ink)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white"
        >
          Open file
        </a>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--ink)]"
        >
          Remove
        </button>
      </div>
    </div>
  )
}

export default function PacketEditorPage() {
  const params = useParams()
  const packetId = typeof params.id === "string" ? params.id : params.id?.[0] ?? ""
  const {
    hydrated,
    getPacket,
    updatePacket,
    uploadAsset,
    removeAsset,
    addSignal,
    updateSignal,
    removeSignal,
    addSource,
    updateSource,
    removeSource,
    setStatus,
  } = usePacketStore()
  const packet = getPacket(packetId)
  const [isUploadingAssets, setIsUploadingAssets] = React.useState(false)
  const [assetFeedback, setAssetFeedback] = React.useState("")
  const assetInputRef = React.useRef<HTMLInputElement | null>(null)

  if (!hydrated) {
    return <Surface>Loading packet...</Surface>
  }

  if (!packet) {
    return (
      <Surface className="space-y-4">
        <p className="text-2xl font-semibold tracking-[-0.04em]">Packet not found.</p>
        <p className="text-[color:var(--muted)]">
          This packet may have been deleted from the workspace database.
        </p>
        <QuickLink href="/inbox" label="Back to Inbox" />
      </Surface>
    )
  }

  const activePacket = packet
  const readyForReview = isReviewReady(activePacket)

  async function handleAssetSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])

    if (files.length === 0) {
      return
    }

    setIsUploadingAssets(true)
    setAssetFeedback("")

    try {
      for (const file of files) {
        await uploadAsset(activePacket.id, { file })
      }

      setAssetFeedback(`${files.length} file${files.length === 1 ? "" : "s"} attached.`)
    } catch {
      setAssetFeedback("Could not upload one or more files.")
    } finally {
      setIsUploadingAssets(false)

      if (assetInputRef.current) {
        assetInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Packet Editor"
        title={packet.title}
        description="Shape the packet before it enters review. This is where the rumor becomes a routed, source-linked correction with enough context to remix safely."
        actions={
          <>
            <QuickLink href={`/studio/${activePacket.id}`} label="Open Studio" />
            <QuickLink href={`/review/${activePacket.id}`} label="Review Gate" />
            <QuickLink href={`/exports/${activePacket.id}`} label="Exports" />
          </>
        }
      />

      <div className="grid gap-8 xl:grid-cols-[0.64fr_0.36fr]">
        <Surface className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={packet.status} />
              <UrgencyPill urgency={activePacket.urgency} />
              <ConfidencePill confidence={activePacket.confidence} />
              <AudiencePill audience={activePacket.leadAudience} />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStatus(packet.id, "draft")}
                className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
              >
                Mark draft
              </button>
              <button
                type="button"
                onClick={() => setStatus(packet.id, "review")}
                className="rounded-full bg-[color:var(--ink)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white"
              >
                Send to review
              </button>
            </div>
          </div>

          <Field label="Title">
            <input
              value={packet.title}
              onChange={(event) => updatePacket(packet.id, { title: event.target.value })}
              className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Pulse label">
              <input
                value={packet.pulse}
                onChange={(event) => updatePacket(packet.id, { pulse: event.target.value })}
                className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
              />
            </Field>
            <Field label="Intake format">
              <input
                value={packet.intakeFormat}
                onChange={(event) => updatePacket(packet.id, { intakeFormat: event.target.value })}
                className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Channel">
              <input
                value={packet.channel}
                onChange={(event) => updatePacket(packet.id, { channel: event.target.value })}
                className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
              />
            </Field>
            <Field label="Region">
              <input
                value={packet.region}
                onChange={(event) => updatePacket(packet.id, { region: event.target.value })}
                className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Urgency">
              <select
                value={packet.urgency}
                onChange={(event) =>
                  updatePacket(packet.id, {
                    urgency: event.target.value as PacketUrgency,
                  })
                }
                className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
              >
                {urgencyLevels.map((level) => (
                  <option key={level} value={level}>
                    {urgencyMeta[level].label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Confidence">
              <select
                value={packet.confidence}
                onChange={(event) =>
                  updatePacket(packet.id, {
                    confidence: event.target.value as PacketConfidence,
                  })
                }
                className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
              >
                {confidenceLevels.map((level) => (
                  <option key={level} value={level}>
                    {confidenceMeta[level].label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Lead lane">
              <select
                value={packet.leadAudience}
                onChange={(event) =>
                  updatePacket(packet.id, {
                    leadAudience: event.target.value as AudienceMode,
                  })
                }
                className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
              >
                {audienceModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {audienceMeta[mode].label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Source link">
            <input
              value={packet.sourceLink}
              onChange={(event) => updatePacket(packet.id, { sourceLink: event.target.value })}
              className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
              placeholder="https://..."
            />
          </Field>

          <Field label="Incoming claim">
            <textarea
              rows={5}
              value={packet.claim}
              onChange={(event) => updatePacket(packet.id, { claim: event.target.value })}
              className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-4 py-3 text-sm leading-7 outline-none transition focus:border-[color:var(--accent)]"
            />
          </Field>

          <Field label="Verified truth">
            <textarea
              rows={5}
              value={packet.truth}
              onChange={(event) => updatePacket(packet.id, { truth: event.target.value })}
              className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-4 py-3 text-sm leading-7 outline-none transition focus:border-[color:var(--accent)]"
              placeholder="Write the cleanest verified correction here."
            />
          </Field>

          <Field label="Why it spreads">
            <textarea
              rows={4}
              value={packet.risk}
              onChange={(event) => updatePacket(packet.id, { risk: event.target.value })}
              className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-4 py-3 text-sm leading-7 outline-none transition focus:border-[color:var(--accent)]"
              placeholder="Why is this format persuasive or easy to forward?"
            />
          </Field>

          <div className="space-y-4 rounded-[1.8rem] border border-black/10 bg-[#fff9f0] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  Signal stack
                </p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  Keep the upstream rumor trail attached to the packet so creators and reviewers can see how it mutated.
                </p>
              </div>
              <button
                type="button"
                onClick={() => addSignal(packet.id)}
                className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white"
              >
                Add signal
              </button>
            </div>

            {packet.signals.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-black/10 bg-white/70 p-5 text-sm leading-7 text-[color:var(--muted)]">
                No captured signals yet. Add at least one version of the rumor trail here.
              </div>
            ) : (
              packet.signals.map((signal, index) => (
                <div
                  key={signal.id}
                  className="grid gap-4 rounded-[1.6rem] border border-black/10 bg-white/80 p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      Signal {index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeSignal(packet.id, signal.id)}
                      className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Kind">
                      <select
                        value={signal.kind}
                        onChange={(event) =>
                          updateSignal(packet.id, signal.id, { kind: event.target.value })
                        }
                        className="w-full rounded-[1.2rem] border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
                      >
                        {signalKinds.map((kind) => (
                          <option key={kind}>{kind}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Label">
                      <input
                        value={signal.label}
                        onChange={(event) =>
                          updateSignal(packet.id, signal.id, { label: event.target.value })
                        }
                        className="w-full rounded-[1.2rem] border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Platform">
                      <input
                        value={signal.platform}
                        onChange={(event) =>
                          updateSignal(packet.id, signal.id, { platform: event.target.value })
                        }
                        className="w-full rounded-[1.2rem] border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
                      />
                    </Field>
                    <Field label="URL">
                      <input
                        value={signal.url}
                        onChange={(event) =>
                          updateSignal(packet.id, signal.id, { url: event.target.value })
                        }
                        className="w-full rounded-[1.2rem] border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
                      />
                    </Field>
                  </div>

                  <Field label="What changed in this version">
                    <textarea
                      rows={3}
                      value={signal.summary}
                      onChange={(event) =>
                        updateSignal(packet.id, signal.id, { summary: event.target.value })
                      }
                      className="w-full rounded-[1.2rem] border border-black/10 bg-white px-4 py-3 text-sm leading-7 outline-none transition focus:border-[color:var(--accent)]"
                    />
                  </Field>
                </div>
              ))
            )}
          </div>

          <div className="space-y-4 rounded-[1.8rem] border border-black/10 bg-white/80 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  Asset locker
                </p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  Keep the raw screenshot, clip, voice note, or PDF attached to the packet so the evidence stays inspectable.
                </p>
              </div>
              <label className="rounded-full bg-[color:var(--ink)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                {isUploadingAssets ? "Uploading..." : "Add files"}
                <input
                  ref={assetInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                  onChange={handleAssetSelection}
                  className="sr-only"
                />
              </label>
            </div>

            {assetFeedback ? (
              <p className="text-sm leading-7 text-[color:var(--muted)]">{assetFeedback}</p>
            ) : null}

            {packet.assets.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-black/10 bg-[#fff9f0] p-5 text-sm leading-7 text-[color:var(--muted)]">
                No evidence files attached yet.
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {packet.assets.map((asset) => (
                  <PacketAssetCard
                    key={asset.id}
                    asset={asset}
                    onRemove={() => {
                      void removeAsset(packet.id, asset.id).catch(() => {
                        setAssetFeedback("Could not remove this file.")
                      })
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  Source ladder
                </p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  Each source should explain what it contributes, not just exist as a bare link.
                </p>
              </div>
              <button
                type="button"
                onClick={() => addSource(packet.id)}
                className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white"
              >
                Add source
              </button>
            </div>

            {packet.sources.map((source, index) => (
              <div
                key={source.id}
                className="grid gap-4 rounded-[1.6rem] border border-black/10 bg-white/70 p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    Source {index + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeSource(packet.id, source.id)}
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Label">
                    <input
                      value={source.label}
                      onChange={(event) =>
                        updateSource(packet.id, source.id, { label: event.target.value })
                      }
                      className="w-full rounded-[1.2rem] border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
                    />
                  </Field>
                  <Field label="Type">
                    <input
                      value={source.type}
                      onChange={(event) =>
                        updateSource(packet.id, source.id, { type: event.target.value })
                      }
                      className="w-full rounded-[1.2rem] border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
                    />
                  </Field>
                </div>

                <Field label="URL">
                  <input
                    value={source.url}
                    onChange={(event) =>
                      updateSource(packet.id, source.id, { url: event.target.value })
                    }
                    className="w-full rounded-[1.2rem] border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
                  />
                </Field>

                <Field label="What this source proves">
                  <textarea
                    rows={3}
                    value={source.detail}
                    onChange={(event) =>
                      updateSource(packet.id, source.id, { detail: event.target.value })
                    }
                    className="w-full rounded-[1.2rem] border border-black/10 bg-white px-4 py-3 text-sm leading-7 outline-none transition focus:border-[color:var(--accent)]"
                  />
                </Field>
              </div>
            ))}
          </div>
        </Surface>

        <div className="space-y-6">
          <Surface className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Packet command
            </p>
            <p className="text-2xl font-semibold tracking-[-0.04em]">{packet.title}</p>
            <p className="text-sm leading-7 text-[color:var(--muted)]">
              Route: {packet.channel} / {packet.region}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.4rem] border border-black/10 bg-white/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Signals
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                  {packet.signals.length}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-black/10 bg-white/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Sources
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                  {packet.sources.length}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-black/10 bg-white/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Uploads
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                  {packet.assets.length}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-black/10 bg-white/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Review checks
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                  {packet.reviewChecklist.filter((item) => item.checked).length}/
                  {packet.reviewChecklist.length}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-black/10 bg-white/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Updated
                </p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  {new Date(packet.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </Surface>

          <Surface className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Readiness
            </p>
            <p className="text-3xl font-semibold tracking-[-0.05em]">
              {readyForReview ? "Ready for review." : "Still shaping."}
            </p>
            <p className="text-base leading-8 text-[color:var(--muted)]">
              {readyForReview
                ? "The packet has a truth statement, evidence, and enough confidence labeling to move to review."
                : "Finish the truth statement, source ladder, review checklist, and confidence label before approval."}
            </p>
          </Surface>

          <Surface className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Next steps
            </p>
            <Link
              href={`/studio/${packet.id}`}
              className="block rounded-[1.4rem] border border-black/10 bg-white/70 p-4 transition hover:bg-white"
            >
              <p className="text-lg font-semibold tracking-[-0.03em]">Studio remix</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                Turn this packet into creator, educator, and collective outputs.
              </p>
            </Link>
            <Link
              href={`/review/${packet.id}`}
              className="block rounded-[1.4rem] border border-black/10 bg-white/70 p-4 transition hover:bg-white"
            >
              <p className="text-lg font-semibold tracking-[-0.03em]">Review gate</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                Check certainty, amplification risk, and the source ladder.
              </p>
            </Link>
            <Link
              href={`/exports/${packet.id}`}
              className="block rounded-[1.4rem] border border-black/10 bg-white/70 p-4 transition hover:bg-white"
            >
              <p className="text-lg font-semibold tracking-[-0.03em]">Exports</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                Copy or download the current handoff package after approval.
              </p>
            </Link>
          </Surface>
        </div>
      </div>
    </div>
  )
}
