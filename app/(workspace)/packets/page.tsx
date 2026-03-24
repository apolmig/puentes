"use client"

import Link from "next/link"
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

const statusFilters = ["all", "draft", "review", "approved"] as const
const urgencyFilters = ["all", "watch", "rising", "critical"] as const
const audienceFilters = ["all", "creator", "educator", "collective"] as const

function FilterPill({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-[color:var(--ink)] px-4 py-2 text-sm font-semibold text-white"
          : "rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-semibold text-[color:var(--ink)]"
      }
    >
      {label}
    </button>
  )
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

export default function PacketsIndexPage() {
  const { hydrated, packets } = usePacketStore()
  const [query, setQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<(typeof statusFilters)[number]>("all")
  const [urgencyFilter, setUrgencyFilter] = React.useState<(typeof urgencyFilters)[number]>("all")
  const [audienceFilter, setAudienceFilter] = React.useState<(typeof audienceFilters)[number]>("all")

  const filteredPackets = React.useMemo(() => {
    return packets.filter((packet) => {
      const matchesQuery =
        query.trim().length === 0 ||
        packet.title.toLowerCase().includes(query.toLowerCase()) ||
        packet.claim.toLowerCase().includes(query.toLowerCase()) ||
        packet.channel.toLowerCase().includes(query.toLowerCase()) ||
        packet.region.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = statusFilter === "all" || packet.status === statusFilter
      const matchesUrgency = urgencyFilter === "all" || packet.urgency === urgencyFilter
      const matchesAudience = audienceFilter === "all" || packet.leadAudience === audienceFilter

      return matchesQuery && matchesStatus && matchesUrgency && matchesAudience
    })
  }, [audienceFilter, packets, query, statusFilter, urgencyFilter])

  const criticalCount = packets.filter((packet) => packet.urgency === "critical").length
  const reviewCount = packets.filter((packet) => packet.status === "review").length
  const approvedCount = packets.filter((packet) => packet.status === "approved").length
  const needsContextCount = packets.filter((packet) => packet.confidence === "developing").length

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Packets"
        title="Every rumor packet in one command board."
        description="Filter the queue by status, urgency, or lead lane, then jump into packet editing, studio, review, or export."
        actions={<QuickLink href="/inbox" label="New Packet" />}
      />

      <Surface className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Queue filters
            </p>
            <p className="text-sm leading-7 text-[color:var(--muted)]">
              Search by title, claim, channel, or region. Then narrow by workflow state or routing lane.
            </p>
          </div>
          <div className="w-full max-w-md">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-[1.2rem] border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
              placeholder="Search title, claim, channel, region..."
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <FilterPill
                key={filter}
                active={statusFilter === filter}
                label={filter}
                onClick={() => setStatusFilter(filter)}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {urgencyFilters.map((filter) => (
              <FilterPill
                key={filter}
                active={urgencyFilter === filter}
                label={filter}
                onClick={() => setUrgencyFilter(filter)}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {audienceFilters.map((filter) => (
              <FilterPill
                key={filter}
                active={audienceFilter === filter}
                label={filter}
                onClick={() => setAudienceFilter(filter)}
              />
            ))}
          </div>
        </div>
      </Surface>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Critical"
          value={String(criticalCount)}
          description="Packets marked as high-harm or fast-moving."
        />
        <MetricCard
          label="In review"
          value={String(reviewCount)}
          description="Packets waiting on checklist completion or approval."
        />
        <MetricCard
          label="Approved"
          value={String(approvedCount)}
          description="Packets ready for export and distribution."
        />
        <MetricCard
          label="Needs context"
          value={String(needsContextCount)}
          description="Packets that should export with visible uncertainty."
        />
      </div>

      <div className="grid gap-4">
        {!hydrated ? (
          <Surface>Loading packets...</Surface>
        ) : filteredPackets.length === 0 ? (
          <Surface className="space-y-3">
            <p className="text-2xl font-semibold tracking-[-0.04em]">No packets match this filter set.</p>
            <p className="text-sm leading-7 text-[color:var(--muted)]">
              Clear the search or change the chips to broaden the queue.
            </p>
          </Surface>
        ) : (
          filteredPackets.map((packet) => (
            <Surface key={packet.id} className="space-y-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-4xl space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={packet.status} />
                    <UrgencyPill urgency={packet.urgency} />
                    <ConfidencePill confidence={packet.confidence} />
                    <AudiencePill audience={packet.leadAudience} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-semibold tracking-[-0.05em]">{packet.title}</h2>
                    <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
                      {packet.channel} / {packet.region}
                    </p>
                  </div>
                  <p className="text-base leading-8 text-[color:var(--muted)]">{packet.claim}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/packets/${packet.id}`}
                    className="rounded-full bg-[color:var(--ink)] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/studio/${packet.id}`}
                    className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-semibold text-[color:var(--ink)]"
                  >
                    Studio
                  </Link>
                  <Link
                    href={`/review/${packet.id}`}
                    className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-semibold text-[color:var(--ink)]"
                  >
                    Review
                  </Link>
                  <Link
                    href={`/exports/${packet.id}`}
                    className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-semibold text-[color:var(--ink)]"
                  >
                    Export
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[0.35fr_0.32fr_0.33fr]">
                <div className="rounded-[1.6rem] border border-black/10 bg-white/70 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                    Verified truth
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                    {packet.truth || "Still empty. Open the packet editor to fill the correction."}
                  </p>
                </div>

                <div className="rounded-[1.6rem] border border-black/10 bg-white/70 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                    Signal stack
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                    {packet.signals.length} signals captured across intake formats.
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                    {packet.assets.length} uploads attached to the packet.
                  </p>
                  <div className="mt-4 space-y-2">
                    {packet.signals.slice(0, 2).map((signal) => (
                      <div
                        key={signal.id}
                        className="rounded-[1.2rem] border border-black/10 bg-white p-3"
                      >
                        <p className="text-sm font-semibold tracking-[-0.02em]">{signal.label}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                          {signal.kind} / {signal.platform}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-black/10 bg-white/70 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                    Review state
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                    {packet.assets.length} uploads / {packet.sources.length} sources /{" "}
                    {packet.reviewChecklist.filter((item) => item.checked).length}/
                    {packet.reviewChecklist.length} review checks complete
                  </p>
                  <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
                    Updated {new Date(packet.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </Surface>
          ))
        )}
      </div>
    </div>
  )
}
