export type AudienceMode = "creator" | "educator" | "collective"
export type PacketStatus = "draft" | "review" | "approved"
export type PacketUrgency = "watch" | "rising" | "critical"
export type PacketConfidence = "unverified" | "developing" | "verified"
export type PacketAssetKind = "image" | "video" | "audio" | "file"

export type PacketSignal = {
  id: string
  kind: string
  label: string
  platform: string
  summary: string
  url: string
}

export type PacketAsset = {
  id: string
  kind: PacketAssetKind
  label: string
  fileName: string
  mimeType: string
  size: number
  url: string
  createdAt: string
}

export type PacketSource = {
  id: string
  label: string
  type: string
  detail: string
  url: string
}

export type PacketVariant = {
  format: string
  hook: string
  body: string
  cta: string
}

export type AudienceResponseCard = {
  label: string
  content: string
}

export type ReviewItem = {
  id: string
  label: string
  checked: boolean
}

export type PacketRecord = {
  id: string
  title: string
  pulse: string
  intakeFormat: string
  sourceLink: string
  channel: string
  region: string
  urgency: PacketUrgency
  confidence: PacketConfidence
  leadAudience: AudienceMode
  claim: string
  truth: string
  risk: string
  status: PacketStatus
  createdAt: string
  updatedAt: string
  signals: PacketSignal[]
  assets: PacketAsset[]
  sources: PacketSource[]
  variants: Record<AudienceMode, PacketVariant>
  reviewChecklist: ReviewItem[]
  reviewNotes: string
}

export const audienceMeta: Record<
  AudienceMode,
  { label: string; caption: string; accentClass: string }
> = {
  creator: {
    label: "Creator",
    caption: "Hooks, captions, and creator-ready framing.",
    accentClass: "bg-[#ff6b3d] text-white",
  },
  educator: {
    label: "Educator",
    caption: "Prompting and source ladders for learning contexts.",
    accentClass: "bg-[#2ec4b6] text-[#072924]",
  },
  collective: {
    label: "Collective",
    caption: "Group-chat-safe replies and organizer handoffs.",
    accentClass: "bg-[#f4c95d] text-[#2f2202]",
  },
}

export const urgencyMeta: Record<
  PacketUrgency,
  { label: string; className: string; description: string }
> = {
  watch: {
    label: "Watch",
    className: "bg-white/75 text-[color:var(--ink)]",
    description: "Low-volume signal worth keeping in view.",
  },
  rising: {
    label: "Rising",
    className: "bg-[#f4c95d] text-[#312300]",
    description: "Cross-posting is picking up and needs a packet soon.",
  },
  critical: {
    label: "Critical",
    className: "bg-[#ff6b3d] text-white",
    description: "Fast-moving or high-harm misinformation.",
  },
}

export const confidenceMeta: Record<
  PacketConfidence,
  { label: string; className: string; description: string }
> = {
  unverified: {
    label: "Unverified",
    className: "bg-white/75 text-[color:var(--ink)]",
    description: "Still gathering receipts and context.",
  },
  developing: {
    label: "Needs context",
    className: "bg-[#87f5e5] text-[#053530]",
    description: "Enough evidence to respond, but with a visible uncertainty label.",
  },
  verified: {
    label: "Verified",
    className: "bg-[#d9ff57] text-[#192100]",
    description: "Evidence is stable and ready for stronger distribution.",
  },
}

export const audienceModes = Object.keys(audienceMeta) as AudienceMode[]
export const urgencyLevels = Object.keys(urgencyMeta) as PacketUrgency[]
export const confidenceLevels = Object.keys(confidenceMeta) as PacketConfidence[]

export function deriveAssetKindFromMimeType(mimeType: string): PacketAssetKind {
  if (mimeType.startsWith("image/")) {
    return "image"
  }

  if (mimeType.startsWith("video/")) {
    return "video"
  }

  if (mimeType.startsWith("audio/")) {
    return "audio"
  }

  return "file"
}

export function formatBytes(size: number) {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const defaultChecklistLabels = [
  "Claim is written in plain language, not platform jargon.",
  "At least two receipts explain why the correction is trustworthy.",
  "The response does not repeat the hottest version of the rumor for reach.",
  "Uncertainty is labeled clearly if the source trail is incomplete.",
]

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function createChecklist(): ReviewItem[] {
  return defaultChecklistLabels.map((label, index) => ({
    id: `review-${index + 1}`,
    label,
    checked: false,
  }))
}

export function createSignal(input?: Partial<PacketSignal>): PacketSignal {
  return {
    id: input?.id ?? makeId("signal"),
    kind: input?.kind ?? "manual note",
    label: input?.label ?? "New signal",
    platform: input?.platform ?? "community intake",
    summary: input?.summary ?? "",
    url: input?.url ?? "",
  }
}

export function createSource(input?: Partial<PacketSource>): PacketSource {
  return {
    id: input?.id ?? makeId("source"),
    label: input?.label ?? "New source",
    type: input?.type ?? "official record",
    detail: input?.detail ?? "",
    url: input?.url ?? "",
  }
}

export function createVariantDefaults(claim: string): Record<AudienceMode, PacketVariant> {
  return {
    creator: {
      format: "vertical video",
      hook: claim ? `Quick correction: ${claim}` : "Quick correction: this claim needs context.",
      body: "Show the strongest receipt early, then keep the explanation short enough to survive the feed.",
      cta: "Pin the source chain and ask people to resend the corrected post instead of the rumor.",
    },
    educator: {
      format: "class prompt",
      hook: claim ? `Start with this claim: ${claim}` : "Start with the rumor students are actually seeing.",
      body: "Map who is making the claim, which source has authority, and where context collapsed.",
      cta: "End by asking what source changed the group's confidence level and why.",
    },
    collective: {
      format: "group-chat reply",
      hook: claim ? `Heads up: ${claim}` : "Heads up: the rumor moving here needs a verified reply.",
      body: "Correct the claim in one sentence, attach one link, and give people a safer message to resend.",
      cta: "Push the verified update back into the same channel before the rumor hardens.",
    },
  }
}

function cleanSentence(text: string, fallback: string, maxLength = 160) {
  const normalized = text.replace(/\s+/g, " ").trim()

  if (!normalized) {
    return fallback
  }

  const sentence = normalized.split(/(?<=[.!?])\s+/)[0] || normalized

  if (sentence.length <= maxLength) {
    return sentence
  }

  return `${sentence.slice(0, maxLength - 1).trimEnd()}…`
}

function joinLabels(values: string[]) {
  if (values.length === 0) {
    return "the source ladder"
  }

  if (values.length === 1) {
    return values[0]
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`
  }

  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`
}

function packetRouteLabel(packet: Pick<PacketRecord, "channel" | "region">) {
  if (packet.region === "general") {
    return packet.channel
  }

  return `${packet.channel} in ${packet.region}`
}

function packetTruthLine(packet: Pick<PacketRecord, "claim" | "truth">) {
  return cleanSentence(
    packet.truth,
    packet.claim
      ? `The claim "${cleanSentence(packet.claim, "This claim needs context.", 90)}" needs context.`
      : "This claim needs context before it spreads.",
  )
}

function packetRiskLine(packet: Pick<PacketRecord, "risk">) {
  return cleanSentence(
    packet.risk,
    "Explain what got flattened, cropped, or reframed when the rumor moved.",
  )
}

function primarySourceLabel(packet: Pick<PacketRecord, "sources">) {
  return packet.sources[0]?.label ?? "the strongest receipt"
}

function sourceCue(packet: Pick<PacketRecord, "sources">) {
  return joinLabels(packet.sources.slice(0, 2).map((source) => source.label))
}

function confidenceCue(packet: Pick<PacketRecord, "confidence">) {
  return confidenceMeta[packet.confidence].label.toLowerCase()
}

export function buildVariantDraft(
  packet: Pick<
    PacketRecord,
    | "channel"
    | "claim"
    | "confidence"
    | "region"
    | "risk"
    | "sources"
    | "truth"
    | "urgency"
  >,
  audience: AudienceMode,
): PacketVariant {
  const truthLine = packetTruthLine(packet)
  const riskLine = packetRiskLine(packet)
  const routeLine = packetRouteLabel(packet)
  const receiptLine = sourceCue(packet)
  const strongestReceipt = primarySourceLabel(packet)
  const confidenceLine = confidenceCue(packet)

  switch (audience) {
    case "creator":
      return {
        format:
          packet.urgency === "critical" ? "rapid vertical correction" : "stitched explainer",
        hook:
          packet.urgency === "critical"
            ? `Stop the repost cycle: ${truthLine}`
            : `Before this gets remixed again: ${truthLine}`,
        body: `${truthLine} The rumor is moving through ${routeLine}. ${riskLine} Lead with ${strongestReceipt}, then show the second receipt fast.`,
        cta: `Label the post ${confidenceLine}, pin ${receiptLine}, and ask people to resend the correction instead of the rumor.`,
      }
    case "educator":
      return {
        format: "classroom reset",
        hook: `Use this rumor as a source-checking exercise, not a panic loop.`,
        body: `${truthLine} Ask students what the viral version leaves out, then compare it against ${receiptLine}. ${riskLine}`,
        cta: `Close with a quick prompt: what source changed your confidence, and why is the packet labeled ${confidenceLine}?`,
      }
    case "collective":
      return {
        format:
          packet.urgency === "critical" ? "group-chat cascade" : "organizer handoff",
        hook: `Share this correction before the rumor hardens in ${routeLine}.`,
        body: `${truthLine} Keep the response short, attach ${strongestReceipt}, and explain why the rumor spread without replaying the hottest version word-for-word.`,
        cta: `Push one verified correction, one receipt from ${receiptLine}, and one clear next step. Tag the packet as ${confidenceLine}.`,
      }
  }
}

export function buildAudienceResponsePack(
  packet: Pick<
    PacketRecord,
    "channel" | "claim" | "confidence" | "region" | "risk" | "sources" | "truth" | "variants"
  >,
  audience: AudienceMode,
): AudienceResponseCard[] {
  const variant = packet.variants[audience]
  const truthLine = packetTruthLine(packet)
  const riskLine = packetRiskLine(packet)
  const strongestReceipt = primarySourceLabel(packet)
  const receiptLine = sourceCue(packet)
  const routeLine = packetRouteLabel(packet)
  const confidenceLine = confidenceCue(packet)

  switch (audience) {
    case "creator":
      return [
        {
          label: "On-screen opener",
          content: variant.hook,
        },
        {
          label: "Caption",
          content: `${variant.hook} ${variant.body} Receipt: ${receiptLine}.`,
        },
        {
          label: "Pinned comment",
          content: `Verified context: ${truthLine} Strongest receipt: ${strongestReceipt}. Confidence label: ${confidenceLine}.`,
        },
        {
          label: "Story beat",
          content: `1. Name the rumor. 2. Drop the correction. 3. Show ${strongestReceipt}. 4. Explain why it spread in ${routeLine}.`,
        },
      ]
    case "educator":
      return [
        {
          label: "Opening prompt",
          content: `What does this rumor claim, and what source would you trust first?`,
        },
        {
          label: "Context reset",
          content: `${truthLine} Use ${receiptLine} to compare the viral version against the verified one.`,
        },
        {
          label: "Discussion prompt",
          content: `Why did this spread in ${routeLine}, and what part of the context got flattened? ${riskLine}`,
        },
        {
          label: "Exit ticket",
          content: `Write one sentence explaining why the packet is labeled ${confidenceLine} and which receipt moved your confidence.`,
        },
      ]
    case "collective":
      return [
        {
          label: "Chat reply",
          content: `${truthLine} Strongest receipt: ${strongestReceipt}. Please resend the correction, not the rumor.`,
        },
        {
          label: "Volunteer brief",
          content: `This rumor is moving through ${routeLine}. Keep the correction short, cite ${receiptLine}, and avoid repeating the hottest rumor wording.`,
        },
        {
          label: "Flyer line",
          content: `Verified update: ${truthLine}`,
        },
        {
          label: "Safety note",
          content: `Label the packet ${confidenceLine} and explain why the rumor stuck: ${riskLine}`,
        },
      ]
  }
}

export function createPacketRecord(input: {
  title: string
  claim: string
  pulse?: string
  intakeFormat?: string
  sourceLink?: string
  channel?: string
  region?: string
  urgency?: PacketUrgency
  confidence?: PacketConfidence
  leadAudience?: AudienceMode
  signals?: PacketSignal[]
}): PacketRecord {
  const timestamp = new Date().toISOString()
  const title = input.title.trim() || "Untitled packet"
  const claim = input.claim.trim()
  const intakeFormat = input.intakeFormat?.trim() || "manual note"
  const sourceLink = input.sourceLink?.trim() || ""
  const channel = input.channel?.trim() || "community intake"
  const region = input.region?.trim() || "general"
  const signals =
    input.signals && input.signals.length > 0
      ? input.signals.map((signal) => createSignal(signal))
      : [
          createSignal({
            label: title,
            kind: intakeFormat,
            platform: channel,
            summary: claim,
            url: sourceLink,
          }),
        ]

  return {
    id: makeId("packet"),
    title,
    pulse: input.pulse?.trim() || "new intake",
    intakeFormat,
    sourceLink,
    channel,
    region,
    urgency: input.urgency ?? "watch",
    confidence: input.confidence ?? "unverified",
    leadAudience: input.leadAudience ?? "creator",
    claim,
    truth: "",
    risk: "",
    status: "draft",
    createdAt: timestamp,
    updatedAt: timestamp,
    signals,
    assets: [],
    sources: [
      createSource({
        label: "Primary source",
        type: "official record",
        detail: sourceLink
          ? "Use this source slot to explain why the linked material should be trusted."
          : "",
        url: sourceLink,
      }),
    ],
    variants: createVariantDefaults(claim),
    reviewChecklist: createChecklist(),
    reviewNotes: "",
  }
}

export function seedPackets(): PacketRecord[] {
  const a = createPacketRecord({
    title: "AI polling panic",
    claim: "A voice note says students now need a second ID to vote on campus.",
    pulse: "group chats heating up",
    intakeFormat: "audio rumor",
    channel: "student group chats",
    region: "Arizona campus network",
    urgency: "critical",
    confidence: "verified",
    leadAudience: "creator",
    signals: [
      createSignal({
        label: "Voice note intake",
        kind: "audio rumor",
        platform: "WhatsApp",
        summary: "A forwarded voice note claims student voters need a second ID to cast a ballot.",
      }),
      createSignal({
        label: "Campus repost",
        kind: "screenshot",
        platform: "Instagram story",
        summary: "Students are screenshotting the note and adding urgency captions.",
      }),
    ],
  })
  a.truth =
    "The campus polling place and accepted IDs did not change. The rumor came from a volunteer training note being reframed as a public rule."
  a.risk =
    "Audio feels personal and urgent, so people forward it before checking who actually has authority."
  a.sources = [
    createSource({
      label: "Election office",
      type: "official update",
      detail:
        "Confirms the polling place and accepted IDs are unchanged for the current election.",
      url: "https://example.org/election-office",
    }),
    createSource({
      label: "Campus FAQ",
      type: "student guidance",
      detail:
        "Explains the same rule in plain language and shows where first-time voters were getting confused.",
      url: "https://example.org/campus-faq",
    }),
  ]
  a.variants.creator = {
    format: "vertical video",
    hook: "That voice note is not an official update, and campus voting rules did not change.",
    body: "The panic came from a volunteer memo, not the election office. Show the county update first and the campus FAQ second.",
    cta: "Pin the official links and tell people to resend those instead of the audio.",
  }

  const b = createPacketRecord({
    title: "Incomplete ID screenshot",
    claim: "A screenshot says first-time voters can no longer use student ID and will be turned away.",
    pulse: "campus repost spike",
    intakeFormat: "screenshot",
    channel: "campus Instagram stories",
    region: "South Texas campuses",
    urgency: "rising",
    confidence: "developing",
    leadAudience: "educator",
    signals: [
      createSignal({
        label: "Cropping chain",
        kind: "screenshot",
        platform: "Instagram",
        summary: "The post strips away the accepted alternatives and exceptions.",
      }),
      createSignal({
        label: "Student confusion",
        kind: "manual note",
        platform: "classroom intake",
        summary: "Teachers are asking for a plain-language explainer before election week.",
      }),
    ],
  })
  b.truth =
    "The screenshot strips away the accepted alternatives and exceptions. The full policy is more nuanced than the graphic makes it appear."
  b.risk =
    "Screenshots look final, even when the underlying rule is more conditional than the post suggests."
  b.sources = [
    createSource({
      label: "State rule",
      type: "policy text",
      detail: "Lists accepted documents and exceptions omitted from the screenshot.",
      url: "https://example.org/state-rule",
    }),
    createSource({
      label: "Voter explainer",
      type: "plain-language guide",
      detail:
        "Translates the rule into scenarios students can actually use on election week.",
      url: "https://example.org/voter-guide",
    }),
  ]

  const c = createPacketRecord({
    title: "Cropped hearing clip",
    claim: "A short clip says city leaders already approved a policy targeting student protest rights.",
    pulse: "creator stitches rising",
    intakeFormat: "video clip",
    channel: "creator remix feeds",
    region: "Mexico City solidarity channels",
    urgency: "rising",
    confidence: "verified",
    leadAudience: "collective",
    signals: [
      createSignal({
        label: "Cropped clip",
        kind: "video clip",
        platform: "TikTok",
        summary: "The viral clip ends before the proposal is challenged and fails.",
      }),
      createSignal({
        label: "Organizer relay",
        kind: "manual note",
        platform: "Signal",
        summary: "Collectives need a short correction for group chats and flyers.",
      }),
    ],
  })
  c.truth =
    "The viral clip ends before the proposal is challenged and fails to pass. The full meeting record changes the meaning completely."
  c.risk =
    "Clips feel authoritative because viewers can see the room and hear the quote, even when the key context lands thirty seconds later."
  c.sources = [
    createSource({
      label: "Full hearing",
      type: "timestamped video",
      detail:
        "Shows the challenge, debate, and failed vote that the viral clip leaves out.",
      url: "https://example.org/full-hearing",
    }),
    createSource({
      label: "Meeting notes",
      type: "official record",
      detail:
        "Confirms the proposal status and documents the actual action taken by the body.",
      url: "https://example.org/meeting-notes",
    }),
  ]

  return [a, b, c]
}

export function isReviewReady(packet: PacketRecord) {
  return (
    packet.truth.trim().length > 0 &&
    packet.sources.length > 0 &&
    packet.confidence !== "unverified" &&
    packet.reviewChecklist.every((item) => item.checked)
  )
}

export function buildExportText(packet: PacketRecord, audience: AudienceMode) {
  const variant = packet.variants[audience]
  const responsePackLines = buildAudienceResponsePack(packet, audience)
    .map((card, index) => `${index + 1}. ${card.label}\n${card.content}`)
    .join("\n\n")
  const signalLines = packet.signals
    .map(
      (signal, index) =>
        `${index + 1}. ${signal.label} (${signal.kind}${signal.platform ? ` / ${signal.platform}` : ""})${signal.url ? ` - ${signal.url}` : ""}`,
    )
    .join("\n")
  const assetLines = packet.assets
    .map(
      (asset, index) =>
        `${index + 1}. ${asset.label} (${asset.kind}${asset.fileName ? ` / ${asset.fileName}` : ""})${asset.url ? ` - ${asset.url}` : ""}`,
    )
    .join("\n")
  const sourceLines = packet.sources
    .map(
      (source, index) =>
        `${index + 1}. ${source.label} (${source.type})${source.url ? ` - ${source.url}` : ""}`,
    )
    .join("\n")

  return [
    "Puentes.info Export",
    "",
    `Packet: ${packet.title}`,
    `Audience: ${audienceMeta[audience].label}`,
    `Status: ${packet.status}`,
    `Urgency: ${urgencyMeta[packet.urgency].label}`,
    `Confidence: ${confidenceMeta[packet.confidence].label}`,
    `Lead lane: ${audienceMeta[packet.leadAudience].label}`,
    `Channel: ${packet.channel}`,
    `Region: ${packet.region}`,
    "",
    "Claim",
    packet.claim,
    "",
    "Verified Truth",
    packet.truth,
    "",
    "Why It Spreads",
    packet.risk,
    "",
    "Signal Stack",
    signalLines,
    "",
    "Uploaded Assets",
    assetLines || "No local uploads attached.",
    "",
    "Format",
    variant.format,
    "",
    "Hook",
    variant.hook,
    "",
    "Body",
    variant.body,
    "",
    "CTA",
    variant.cta,
    "",
    "Response Pack",
    responsePackLines,
    "",
    "Sources",
    sourceLines,
    "",
    "Review Notes",
    packet.reviewNotes || "No reviewer notes yet.",
  ].join("\n")
}
