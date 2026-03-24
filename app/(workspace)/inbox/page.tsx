"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
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
  audienceMeta,
  audienceModes,
  confidenceLevels,
  confidenceMeta,
  createSignal,
  deriveAssetKindFromMimeType,
  formatBytes,
  urgencyLevels,
  urgencyMeta,
} from "@/lib/bridgebeat"

const intakeOptions = ["manual note", "link", "screenshot", "video clip", "audio rumor"]
const signalKinds = ["manual note", "link", "screenshot", "video clip", "audio rumor"]

function hasSignalContent(signal: {
  label: string
  platform: string
  summary: string
  url: string
}) {
  return [signal.label, signal.platform, signal.summary, signal.url].some((value) => value.trim().length > 0)
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description: string
}) {
  return (
    <div className="rounded-[1.5rem] border border-black/10 bg-white/75 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">{value}</p>
      <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{description}</p>
    </div>
  )
}

export default function InboxPage() {
  const router = useRouter()
  const { hydrated, packets, createPacket, uploadAsset } = usePacketStore()
  const [form, setForm] = React.useState({
    title: "",
    claim: "",
    pulse: "",
    intakeFormat: "manual note",
    sourceLink: "",
    channel: "community intake",
    region: "general",
    urgency: "watch" as const,
    confidence: "unverified" as const,
    leadAudience: "creator" as const,
  })
  const [signals, setSignals] = React.useState(() => [
    createSignal({
      label: "Initial intake",
      kind: "manual note",
      platform: "community intake",
    }),
  ])
  const [attachments, setAttachments] = React.useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [feedback, setFeedback] = React.useState("")
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const criticalCount = packets.filter((packet) => packet.urgency === "critical").length
  const reviewCount = packets.filter((packet) => packet.status === "review").length
  const contextCount = packets.filter((packet) => packet.confidence === "developing").length
  const creatorLeadCount = packets.filter((packet) => packet.leadAudience === "creator").length

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  function updateSignalField(
    signalId: string,
    name: keyof (typeof signals)[number],
    value: string,
  ) {
    setSignals((current) =>
      current.map((signal) => (signal.id === signalId ? { ...signal, [name]: value } : signal)),
    )
  }

  function addSignalRow() {
    setSignals((current) => [
      ...current,
      createSignal({
        kind: form.intakeFormat,
        platform: form.channel,
      }),
    ])
  }

  function removeSignalRow(signalId: string) {
    setSignals((current) => current.filter((signal) => signal.id !== signalId))
  }

  function resetForm() {
    setForm({
      title: "",
      claim: "",
      pulse: "",
      intakeFormat: "manual note",
      sourceLink: "",
      channel: "community intake",
      region: "general",
      urgency: "watch",
      confidence: "unverified",
      leadAudience: "creator",
    })
    setSignals([
      createSignal({
        label: "Initial intake",
        kind: "manual note",
        platform: "community intake",
      }),
    ])
    setAttachments([])
    setFeedback("")

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setFeedback("")

    try {
      const preparedSignals = signals
        .filter(hasSignalContent)
        .map((signal, index) => ({
          ...signal,
          label: signal.label.trim() || `Signal ${index + 1}`,
          kind: signal.kind.trim() || form.intakeFormat,
          platform: signal.platform.trim() || form.channel,
          summary: signal.summary.trim() || form.claim.trim(),
        }))
      const id = await createPacket({
        ...form,
        signals: preparedSignals,
      })

      for (const file of attachments) {
        await uploadAsset(id, { file })
      }

      resetForm()
      router.push(`/packets/${id}`)
    } catch {
      setFeedback("Could not create the packet and upload the attached files.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleAttachmentChange(event: React.ChangeEvent<HTMLInputElement>) {
    setAttachments(Array.from(event.target.files ?? []))
  }

  function removeAttachment(name: string) {
    setAttachments((current) => current.filter((file) => file.name !== name))
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Inbox"
        title="Catch the rumor while it is still moving."
        description="Route a rumor into the workspace with channel, region, urgency, confidence, and a stack of captured signals before the packet hardens."
        actions={<QuickLink href="/packets" label="Browse Packets" />}
      />

      <div className="grid gap-8 xl:grid-cols-[0.58fr_0.42fr]">
        <Surface className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Triage intake
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em]">
                Build the packet from what people are actually sharing.
              </h2>
              <p className="text-sm leading-7 text-[color:var(--muted)]">
                Multiple signals let the packet track the rumor across links, screenshots, clips, and group-chat notes without losing context.
              </p>
            </div>
            <AudiencePill audience={form.leadAudience} />
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Packet title
              </label>
              <input
                required
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
                placeholder="AI polling panic"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Incoming claim
              </label>
              <textarea
                required
                value={form.claim}
                onChange={(event) => updateField("claim", event.target.value)}
                rows={5}
                className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-4 py-3 text-sm leading-7 outline-none transition focus:border-[color:var(--accent)]"
                placeholder="Paste the rumor, clip summary, screenshot text, or voice-note transcript."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  Intake format
                </label>
                <select
                  value={form.intakeFormat}
                  onChange={(event) => updateField("intakeFormat", event.target.value)}
                  className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
                >
                  {intakeOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  Pulse label
                </label>
                <input
                  value={form.pulse}
                  onChange={(event) => updateField("pulse", event.target.value)}
                  className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
                  placeholder="campus repost spike"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  Channel
                </label>
                <input
                  value={form.channel}
                  onChange={(event) => updateField("channel", event.target.value)}
                  className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
                  placeholder="student group chats"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  Region
                </label>
                <input
                  value={form.region}
                  onChange={(event) => updateField("region", event.target.value)}
                  className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
                  placeholder="South Texas campuses"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  Urgency
                </label>
                <select
                  value={form.urgency}
                  onChange={(event) => updateField("urgency", event.target.value)}
                  className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
                >
                  {urgencyLevels.map((level) => (
                    <option key={level} value={level}>
                      {urgencyMeta[level].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  Confidence
                </label>
                <select
                  value={form.confidence}
                  onChange={(event) => updateField("confidence", event.target.value)}
                  className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
                >
                  {confidenceLevels.map((level) => (
                    <option key={level} value={level}>
                      {confidenceMeta[level].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  Lead lane
                </label>
                <select
                  value={form.leadAudience}
                  onChange={(event) => updateField("leadAudience", event.target.value)}
                  className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
                >
                  {audienceModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {audienceMeta[mode].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Source link
              </label>
              <input
                value={form.sourceLink}
                onChange={(event) => updateField("sourceLink", event.target.value)}
                className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
                placeholder="https://..."
              />
            </div>

            <div className="space-y-4 rounded-[1.8rem] border border-black/10 bg-white/80 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                    Evidence uploads
                  </p>
                  <p className="text-sm leading-7 text-[color:var(--muted)]">
                    Attach screenshots, clips, audio notes, or PDFs directly to the packet.
                  </p>
                </div>
                <label className="rounded-full bg-[color:var(--ink)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                  Add files
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                    onChange={handleAttachmentChange}
                    className="sr-only"
                  />
                </label>
              </div>

              {attachments.length === 0 ? (
                <div className="rounded-[1.4rem] border border-dashed border-black/10 bg-[#fff9f0] p-4 text-sm leading-7 text-[color:var(--muted)]">
                  No files selected yet.
                </div>
              ) : (
                <div className="grid gap-3">
                  {attachments.map((file) => (
                    <div
                      key={`${file.name}-${file.size}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-[1.4rem] border border-black/10 bg-[#fff9f0] p-4"
                    >
                      <div>
                        <p className="text-sm font-semibold tracking-[-0.02em]">{file.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                          {deriveAssetKindFromMimeType(file.type)} / {formatBytes(file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(file.name)}
                        className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4 rounded-[1.8rem] border border-black/10 bg-[#fff9f0] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                    Signal stack
                  </p>
                  <p className="text-sm leading-7 text-[color:var(--muted)]">
                    Capture each version of the rumor as it moves through platforms and formats.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addSignalRow}
                  className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                >
                  Add signal
                </button>
              </div>

              <div className="space-y-4">
                {signals.map((signal, index) => (
                  <div
                    key={signal.id}
                    className="grid gap-4 rounded-[1.5rem] border border-black/10 bg-white/80 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                        Signal {index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeSignalRow(signal.id)}
                        className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                          Kind
                        </label>
                        <select
                          value={signal.kind}
                          onChange={(event) =>
                            updateSignalField(signal.id, "kind", event.target.value)
                          }
                          className="w-full rounded-[1.2rem] border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
                        >
                          {signalKinds.map((kind) => (
                            <option key={kind}>{kind}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                          Label
                        </label>
                        <input
                          value={signal.label}
                          onChange={(event) =>
                            updateSignalField(signal.id, "label", event.target.value)
                          }
                          className="w-full rounded-[1.2rem] border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
                          placeholder="Forwarded voice note"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                          Platform
                        </label>
                        <input
                          value={signal.platform}
                          onChange={(event) =>
                            updateSignalField(signal.id, "platform", event.target.value)
                          }
                          className="w-full rounded-[1.2rem] border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
                          placeholder="WhatsApp"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                          URL
                        </label>
                        <input
                          value={signal.url}
                          onChange={(event) => updateSignalField(signal.id, "url", event.target.value)}
                          className="w-full rounded-[1.2rem] border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                        Summary
                      </label>
                      <textarea
                        rows={3}
                        value={signal.summary}
                        onChange={(event) =>
                          updateSignalField(signal.id, "summary", event.target.value)
                        }
                        className="w-full rounded-[1.2rem] border border-black/10 bg-white px-4 py-3 text-sm leading-7 outline-none transition focus:border-[color:var(--accent)]"
                        placeholder="What is this version of the rumor claiming or omitting?"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[color:var(--accent-deep)]"
            >
              {isSubmitting ? "Creating packet..." : "Create packet"}
            </button>
            {feedback ? (
              <p className="text-sm leading-7 text-[color:var(--muted)]">{feedback}</p>
            ) : null}
          </form>
        </Surface>

        <div className="space-y-6">
          <Surface className="space-y-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  Queue radar
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                  What the desk is handling right now.
                </h2>
              </div>
              <p className="text-sm text-[color:var(--muted)]">
                {hydrated ? `${packets.length} packets` : "Loading..."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard
                label="Critical"
                value={String(criticalCount)}
                description="Fast-moving packets that need rapid correction."
              />
              <MetricCard
                label="In review"
                value={String(reviewCount)}
                description="Packets waiting on approval or reviewer notes."
              />
              <MetricCard
                label="Needs context"
                value={String(contextCount)}
                description="Packets that can ship only with visible uncertainty."
              />
              <MetricCard
                label="Creator lead"
                value={String(creatorLeadCount)}
                description="Packets currently routed toward creator-facing outputs."
              />
            </div>
          </Surface>

          <Surface className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  Live queue
                </p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  Jump from intake to edit, studio, or review.
                </p>
              </div>
              <QuickLink href="/packets" label="Open Queue" />
            </div>

            <div className="space-y-4">
              {packets.slice(0, 4).map((packet) => (
                <div
                  key={packet.id}
                  className="rounded-[1.6rem] border border-black/10 bg-white/75 p-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={packet.status} />
                    <UrgencyPill urgency={packet.urgency} />
                    <ConfidencePill confidence={packet.confidence} />
                    <AudiencePill audience={packet.leadAudience} />
                  </div>
                  <p className="mt-4 text-xl font-semibold tracking-[-0.03em]">{packet.title}</p>
                  <p className="mt-2 text-sm uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    {packet.channel} / {packet.region}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">{packet.claim}</p>
                  <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
                    {packet.signals.length} signals / {packet.assets.length} uploads / {packet.sources.length} sources
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={`/packets/${packet.id}`}
                      className="rounded-full bg-[color:var(--ink)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                    >
                      Edit packet
                    </Link>
                    <Link
                      href={`/studio/${packet.id}`}
                      className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--ink)]"
                    >
                      Open studio
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  )
}
