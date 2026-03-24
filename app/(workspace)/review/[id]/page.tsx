"use client"

import { useParams } from "next/navigation"

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
import { isReviewReady } from "@/lib/bridgebeat"

export default function ReviewPage() {
  const params = useParams()
  const packetId = typeof params.id === "string" ? params.id : params.id?.[0] ?? ""
  const { hydrated, getPacket, toggleReviewItem, setReviewNotes, setStatus } = usePacketStore()
  const packet = getPacket(packetId)

  if (!hydrated) {
    return <Surface>Loading review gate...</Surface>
  }

  if (!packet) {
    return (
      <Surface className="space-y-4">
        <p className="text-2xl font-semibold tracking-[-0.04em]">Packet not found.</p>
        <QuickLink href="/inbox" label="Back to Inbox" />
      </Surface>
    )
  }

  const ready = isReviewReady(packet)

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Review"
        title={`Gate ${packet.title}`}
        description="Nothing should leave the workspace until the evidence is clear, the uncertainty label is honest, and the amplification risk has been checked."
        actions={
          <>
            <QuickLink href={`/packets/${packet.id}`} label="Packet Editor" />
            <QuickLink href={`/studio/${packet.id}`} label="Studio" />
            <QuickLink href={`/exports/${packet.id}`} label="Exports" />
          </>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[0.55fr_0.45fr]">
        <Surface className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={packet.status} />
              <UrgencyPill urgency={packet.urgency} />
              <ConfidencePill confidence={packet.confidence} />
              <AudiencePill audience={packet.leadAudience} />
            </div>
            <p className="text-sm text-[color:var(--muted)]">
              {packet.reviewChecklist.filter((item) => item.checked).length}/
              {packet.reviewChecklist.length} checks complete
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.4rem] border border-black/10 bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Route
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                {packet.channel}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-black/10 bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Region
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                {packet.region}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-black/10 bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Signals
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                {packet.signals.length} attached
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Reviewer checklist
            </p>
            <div className="space-y-3">
              {packet.reviewChecklist.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleReviewItem(packet.id, item.id)}
                  className={
                    item.checked
                      ? "flex w-full items-start gap-3 rounded-[1.4rem] border border-[#d9ff57] bg-[#f6ffcb] p-4 text-left"
                      : "flex w-full items-start gap-3 rounded-[1.4rem] border border-black/10 bg-white/70 p-4 text-left"
                  }
                >
                  <span
                    className={
                      item.checked
                        ? "mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#192100] text-xs text-[#d9ff57]"
                        : "mt-1 h-5 w-5 rounded-full border border-black/20"
                    }
                  >
                    {item.checked ? "OK" : ""}
                  </span>
                  <span className="text-sm leading-7 text-[color:var(--ink)]">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Reviewer notes
            </label>
            <textarea
              rows={5}
              value={packet.reviewNotes}
              onChange={(event) => setReviewNotes(packet.id, event.target.value)}
              className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-4 py-3 text-sm leading-7 outline-none transition focus:border-[color:var(--accent)]"
              placeholder="Leave context for the next creator, educator, or reviewer."
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!ready}
              onClick={() => setStatus(packet.id, "approved")}
              className={
                ready
                  ? "rounded-full bg-[color:var(--ink)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white"
                  : "cursor-not-allowed rounded-full bg-black/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black/40"
              }
            >
              Approve export
            </button>
            <button
              type="button"
              onClick={() => setStatus(packet.id, "draft")}
              className="rounded-full border border-black/10 bg-white/80 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--ink)]"
            >
              Send back to draft
            </button>
          </div>
        </Surface>

        <div className="space-y-6">
          <Surface className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Approval state
            </p>
            <p className="text-3xl font-semibold tracking-[-0.05em]">
              {ready ? "Ready to approve." : "Still blocked."}
            </p>
            <p className="text-base leading-8 text-[color:var(--muted)]">
              {ready
                ? "The packet has a truth statement, source ladder, completed review checks, and a visible confidence label."
                : "Finish the checklist and make sure the truth, sources, and confidence label are complete before approving export."}
            </p>
          </Surface>

          <Surface className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Review snapshot
            </p>
            <p className="text-lg font-semibold tracking-[-0.03em]">{packet.claim}</p>
            <p className="text-sm leading-7 text-[color:var(--muted)]">
              {packet.truth || "Truth field still empty."}
            </p>
            <p className="text-sm leading-7 text-[color:var(--muted)]">
              {packet.risk || "Spread analysis still empty."}
            </p>
          </Surface>

          <Surface className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Next step
            </p>
            <QuickLink href={`/exports/${packet.id}`} label="Open Exports" />
          </Surface>
        </div>
      </div>
    </div>
  )
}
