"use client"

import Link from "next/link"
import type { ReactNode } from "react"

import {
  type PacketConfidence,
  type PacketStatus,
  type PacketUrgency,
  audienceMeta,
  confidenceMeta,
  urgencyMeta,
} from "@/lib/bridgebeat"

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl space-y-4">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-[color:var(--accent-deep)]">
          {eyebrow}
        </p>
        <h1 className="text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">{title}</h1>
        <p className="text-lg leading-8 text-[color:var(--muted)]">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  )
}

export function Surface({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={[
        "glass-panel rounded-[2rem] p-6 shadow-[0_18px_60px_rgba(15,23,38,0.08)] sm:p-8",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  )
}

export function StatusPill({ status }: { status: PacketStatus }) {
  const classes =
    status === "approved"
      ? "bg-[#d9ff57] text-[#192100]"
      : status === "review"
        ? "bg-[#f4c95d] text-[#312300]"
        : "bg-white/75 text-[color:var(--ink)]"

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${classes}`}>
      {status}
    </span>
  )
}

export function UrgencyPill({ urgency }: { urgency: PacketUrgency }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${urgencyMeta[urgency].className}`}
    >
      {urgencyMeta[urgency].label}
    </span>
  )
}

export function ConfidencePill({ confidence }: { confidence: PacketConfidence }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${confidenceMeta[confidence].className}`}
    >
      {confidenceMeta[confidence].label}
    </span>
  )
}

export function AudiencePill({ audience }: { audience: keyof typeof audienceMeta }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${audienceMeta[audience].accentClass}`}>
      {audienceMeta[audience].label}
    </span>
  )
}

export function QuickLink({
  href,
  label,
  active,
}: {
  href: string
  label: string
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-[color:var(--ink)] px-4 py-2 text-sm font-semibold text-white"
          : "rounded-full border border-black/10 bg-white/75 px-4 py-2 text-sm font-semibold text-[color:var(--ink)] transition hover:bg-white"
      }
    >
      {label}
    </Link>
  )
}
