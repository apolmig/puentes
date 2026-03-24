"use client"

import Image from "next/image"
import { useState } from "react"
import type { ReactNode, SVGProps } from "react"

type PhotoId = "friends" | "creator" | "classroom" | "protest" | "mural"
type PathwayId = "creator" | "educator" | "collective"

type PhotoAsset = {
  src: string
  alt: string
  credit: string
  href: string
}

type Pathway = {
  id: PathwayId
  label: string
  eyebrow: string
  title: string
  text: string
  move: string
  audience: string
  outputs: string[]
  photo: PhotoId
  accentClass: string
}

type Packet = {
  id: "deepfake" | "voter" | "clip"
  label: string
  pulse: string
  claim: string
  truth: string
  risk: string
  sources: Array<{
    label: string
    type: string
    detail: string
  }>
  responses: Record<
    PathwayId,
    {
      format: string
      hook: string
      body: string
      cta: string
    }
  >
}

const photos: Record<PhotoId, PhotoAsset> = {
  friends: {
    src: "https://images.unsplash.com/photo-1687293233269-c6df38c3662f?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1800",
    alt: "A Latina woman holding a cell phone",
    credit: "Omar Lopez",
    href: "https://unsplash.com/photos/a-woman-standing-in-front-of-a-counter-holding-a-cell-phone-iuBoZIZQkKM",
  },
  creator: {
    src: "https://images.unsplash.com/photo-1637249772031-df4717fc3f2d?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1800",
    alt: "A creator sitting at a desk in front of a camera",
    credit: "Akhil Yerabati",
    href: "https://unsplash.com/photos/a-man-sitting-at-a-desk-in-front-of-a-camera-ptpljST64Uc",
  },
  classroom: {
    src: "https://images.unsplash.com/photo-1758270705172-07b53627dfcb?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1800",
    alt: "A diverse group of students gathered around a laptop in a classroom",
    credit: "Vitaly Gariev",
    href: "https://unsplash.com/photos/diverse-group-of-students-gathered-around-a-laptop-EA0-iajPYFE",
  },
  protest: {
    src: "https://images.unsplash.com/photo-1770223951391-2039bffec47a?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1800",
    alt: "People protesting with flags and signs, including a Mexican flag",
    credit: "Desiray Green",
    href: "https://unsplash.com/photos/people-protest-with-flags-and-signs-sERS1JpVReg",
  },
  mural: {
    src: "https://images.unsplash.com/photo-1763821760549-2acabfa6c72e?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1800",
    alt: "A mural in Oaxaca depicting workers and a clenched fist",
    credit: "ayumi kubo",
    href: "https://unsplash.com/photos/mural-depicting-workers-and-a-clenched-fist-iMgBynloqrE",
  },
}

const pathways: Pathway[] = [
  {
    id: "creator",
    label: "Creator Mode",
    eyebrow: "Scroll-stopping civic response",
    title: "Turn a fast rumor cycle into something a creator would actually post.",
    text: "This mode builds hooks, scene beats, captions, and pinned comments that feel native to TikTok, Reels, and carousel explainers.",
    move: "Lead with the correction, keep the best receipt on screen, and never amplify the juiciest version of the lie for clicks.",
    audience: "Independent creators, youth-led news accounts, and civic explainers.",
    outputs: ["cold open", "caption spine", "comment rescue", "receipt stack"],
    photo: "creator",
    accentClass: "bg-[#ff6b3d] text-white",
  },
  {
    id: "educator",
    label: "Educator Mode",
    eyebrow: "Media literacy that looks alive",
    title: "Translate the same signal into classroom prompts, source ladders, and discussion moves.",
    text: "Instead of flattening students with a generic fact-check, Puentes.info turns each rumor into a visible chain of evidence they can inspect together.",
    move: "Slow down the rumor, show where context broke, and turn verification into a shared practice instead of a lecture.",
    audience: "Teachers, workshop leaders, librarians, and youth civic educators.",
    outputs: ["warm-up slide", "source ladder", "discussion prompt", "exit ticket"],
    photo: "classroom",
    accentClass: "bg-[#2ec4b6] text-[#072924]",
  },
  {
    id: "collective",
    label: "Collective Mode",
    eyebrow: "Group-chat-ready civic trust",
    title: "Equip campus teams and community groups with a response kit that corrects without clowning the sharer.",
    text: "This lane is built for peer networks: student orgs, mutual-aid crews, democracy clubs, and local groups trying to stop a rumor before it hardens.",
    move: "Reply in the same channel, use one line of proof, and give people a safer thing to resend right away.",
    audience: "Campus organizers, group-chat admins, and community trust networks.",
    outputs: ["group-chat reply", "tabling script", "share-safe CTA", "community note"],
    photo: "protest",
    accentClass: "bg-[#f4c95d] text-[#2f2202]",
  },
]

const tickerItems = [
  "deepfake panic",
  "voter-rule rumor",
  "cropped clip spiral",
  "group-chat correction",
  "source-linked creator cut",
  "classroom rumor map",
  "receipt-first civic design",
]

const protocol = [
  {
    number: "01",
    title: "Spot the spike",
    text: "Start with the exact post format Gen Z is seeing, not a cleaned-up summary.",
  },
  {
    number: "02",
    title: "Trace the receipts",
    text: "Map the source trail and surface where the context got cut, clipped, or rewritten.",
  },
  {
    number: "03",
    title: "Remix for trust",
    text: "Translate the truth into creator language, classroom language, and community language.",
  },
  {
    number: "04",
    title: "Ship the fix",
    text: "Publish something source-linked, culturally native, and safe to pass on.",
  },
]

const outputRails = [
  {
    title: "Signal brief",
    text: "A concise myth packet with the claim, what is true, what is missing, and the best public-facing framing.",
  },
  {
    title: "Creator handoff",
    text: "Hooks, scene beats, pinned comments, and citation logic built for video and carousel formats.",
  },
  {
    title: "Classroom remix",
    text: "Slide prompts, source ladders, and reflection cues for teachers and workshop leaders.",
  },
]

const packets: Packet[] = [
  {
    id: "deepfake",
    label: "AI voice note",
    pulse: "group chats heating up",
    claim:
      "A voice note says polling places near campus changed overnight and students now need a second ID.",
    truth:
      "The campus polling location did not change. The confusion came from a volunteer training note about backup verification.",
    risk:
      "Audio feels intimate and urgent, so people forward it before checking whether it came from an official source.",
    sources: [
      {
        label: "election office",
        type: "official update",
        detail:
          "The county election office confirms the polling site and accepted IDs are unchanged for the current election.",
      },
      {
        label: "campus FAQ",
        type: "student guidance",
        detail:
          "The campus civic office explains the same rules in plain language and clarifies where first-time voters were getting confused.",
      },
      {
        label: "training memo",
        type: "context break",
        detail:
          "A volunteer prep memo mentioned a fallback verification step, which got misheard as a new public rule.",
      },
    ],
    responses: {
      creator: {
        format: "vertical video cut",
        hook: "That viral voice note is not an official update, and campus voting rules did not change.",
        body:
          "The panic came from a volunteer memo, not from the election office. The safest thing to repost is the actual county update plus the campus FAQ.",
        cta: "Pin the official link and tell people to resend that instead of the audio.",
      },
      educator: {
        format: "class warm-up",
        hook: "Before we react to the audio, let’s trace who made the claim and who has authority here.",
        body:
          "Students compare the voice note, the campus FAQ, and the county update, then identify the exact point where context broke.",
        cta: "End with: what source changed your confidence level, and why?",
      },
      collective: {
        format: "group-chat reply",
        hook: "Quick correction: that voice note is not official and the polling rules are the same.",
        body:
          "The rumor came from a volunteer note getting remixed into a fake public announcement. Here is the county link and the campus explainer.",
        cta: "If you resend anything, resend the verified link thread instead.",
      },
    },
  },
  {
    id: "voter",
    label: "ID rumor screenshot",
    pulse: "campus repost spike",
    claim:
      "A screenshot says first-time voters can no longer use student ID and will be turned away at the polls.",
    truth:
      "Student ID eligibility depends on state rules, but the screenshot oversimplifies a broader verification process and leaves out accepted alternatives.",
    risk:
      "Screenshots travel well because they look final, even when the underlying guidance is more nuanced than the graphic makes it seem.",
    sources: [
      {
        label: "state rule",
        type: "law + policy",
        detail:
          "The actual voter ID rule lists accepted documents and exceptions; the screenshot strips away those details and presents a blanket ban.",
      },
      {
        label: "election explainer",
        type: "plain-language guide",
        detail:
          "A voter guide translates the policy into scenarios students actually face, including what to bring if they are unsure.",
      },
      {
        label: "misleading post",
        type: "format analysis",
        detail:
          "The post highlights the scariest sentence fragment without the surrounding instructions, which makes the rule look harsher than it is.",
      },
    ],
    responses: {
      creator: {
        format: "carousel",
        hook: "This screenshot is leaving out the part that tells you what counts if you do not have one specific ID.",
        body:
          "Instead of reposting panic, show the real rule, the accepted alternatives, and the one line students should screenshot before they head to vote.",
        cta: "End with a saveable slide: bring this list, not the rumor.",
      },
      educator: {
        format: "source ladder",
        hook: "This is a perfect example of how a true fragment becomes a misleading whole.",
        body:
          "Students compare the cropped screenshot with the full rule and identify which missing lines change the interpretation.",
        cta: "Ask: what did the post technically show, and what did it hide?",
      },
      collective: {
        format: "campus post + chat follow-up",
        hook: "Heads up: that screenshot is incomplete, not a full voting guide.",
        body:
          "Share the actual accepted-ID list, the fallback options, and where students can verify before election day.",
        cta: "Push one share-safe checklist into org chats and story slides.",
      },
    },
  },
  {
    id: "clip",
    label: "cropped hearing clip",
    pulse: "creator stitches rising",
    claim:
      "A short clip says city leaders already approved a policy targeting student protest rights.",
    truth:
      "The viral clip ends before the proposal is challenged and fails to pass. The meeting record changes the meaning completely.",
    risk:
      "Clips feel authoritative because viewers can see the room and hear the quote, even if the key context lands thirty seconds later.",
    sources: [
      {
        label: "full hearing",
        type: "timestamped video",
        detail:
          "The full recording shows the challenge, debate, and failed vote that the viral clip cuts away from.",
      },
      {
        label: "meeting agenda",
        type: "official record",
        detail:
          "The agenda and final notes show the proposal status and the actual action taken by the body.",
      },
      {
        label: "local reporting",
        type: "independent confirmation",
        detail:
          "Local coverage summarizes the sequence and provides context for why the clipped version feels more dramatic than the full story.",
      },
    ],
    responses: {
      creator: {
        format: "stitch-safe explainer",
        hook: "That meeting clip cuts off before the proposal actually falls apart.",
        body:
          "Open with the missing thirty seconds, then show the agenda screenshot and the local recap so viewers can see why the viral version is incomplete.",
        cta: "Make slide two the timestamp proof, not just commentary.",
      },
      educator: {
        format: "timeline exercise",
        hook: "This is what context collapse looks like in motion.",
        body:
          "Build a three-part timeline: viral clip, missing moment, official record. Let students name how the edit changed the claim.",
        cta: "Close with: what would you need to see before reposting a political clip?",
      },
      collective: {
        format: "campus organizer brief",
        hook: "The policy was not approved, and the clip moving around leaves out the failed vote.",
        body:
          "Share the full timestamp, the meeting notes, and a calmer summary people can forward without overstating the threat.",
        cta: "Use the corrected summary as the message template for chats and meetings.",
      },
    },
  },
]

const featureStrip = [
  {
    title: "Signal radar",
    text: "Track rumor formats, not just topics: audio notes, screenshots, clipped hearings, stitched videos.",
  },
  {
    title: "Source ladder",
    text: "Click through the evidence chain and show exactly where context broke.",
  },
  {
    title: "Remix engine",
    text: "One packet becomes creator copy, classroom material, and community responses.",
  },
  {
    title: "Share-safe handoff",
    text: "Outputs stay source-linked and human-approved before they travel.",
  },
]

function joinClasses(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ")
}

function ArrowUpRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </svg>
  )
}

function SparkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
      <path d="m18.5 15.5.8 2.1 2.2.8-2.2.8-.8 2.1-.8-2.1-2.2-.8 2.2-.8.8-2.1Z" />
    </svg>
  )
}

function Panel({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <div className={joinClasses("glass-panel rounded-[999px]", className)}>{children}</div>
}

function PhotoCredit({
  photo,
  className,
}: {
  photo: PhotoAsset
  className?: string
}) {
  return (
    <a
      href={photo.href}
      target="_blank"
      rel="noreferrer"
      className={joinClasses(
        "inline-flex items-center gap-2 rounded-full bg-black/65 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-white backdrop-blur",
        className,
      )}
    >
      Photo by {photo.credit}
      <ArrowUpRightIcon className="h-3 w-3" />
    </a>
  )
}

export default function Page() {
  const [activeId, setActiveId] = useState<PathwayId>("creator")
  const [activePacketId, setActivePacketId] = useState<Packet["id"]>("deepfake")
  const [activeSourceIndex, setActiveSourceIndex] = useState(0)
  const activePathway = pathways.find((pathway) => pathway.id === activeId) ?? pathways[0]
  const activePhoto = photos[activePathway.photo]
  const activePacket = packets.find((packet) => packet.id === activePacketId) ?? packets[0]
  const activeSource = activePacket.sources[activeSourceIndex] ?? activePacket.sources[0]
  const activeResponse = activePacket.responses[activeId]

  return (
    <main className="relative overflow-hidden pb-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(circle_at_top,rgba(255,107,61,0.18),transparent_58%)]" />
      <div className="pointer-events-none absolute left-[-12rem] top-[26rem] h-96 w-96 rounded-full bg-[rgba(46,196,182,0.18)] blur-3xl float-slower" />
      <div className="pointer-events-none absolute right-[-12rem] top-20 h-[28rem] w-[28rem] rounded-full bg-[rgba(244,201,93,0.16)] blur-3xl float-slow" />

      <div className="mx-auto max-w-[96rem] px-4 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-40 pt-4">
          <Panel className="px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <a href="#top" className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-sm font-semibold text-white shadow-[0_12px_30px_rgba(255,107,61,0.32)]">
                  PI
                </span>
                <span className="flex flex-col">
                  <span className="text-lg font-semibold tracking-[-0.04em]">Puentes.info</span>
                  <span className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                    Creator studio for civic response
                  </span>
                </span>
              </a>

              <nav className="hidden items-center gap-6 text-sm text-[color:var(--muted)] md:flex">
                <a className="transition hover:text-[color:var(--ink)]" href="#modes">
                  Modes
                </a>
                <a className="transition hover:text-[color:var(--ink)]" href="#features">
                  Features
                </a>
                <a className="transition hover:text-[color:var(--ink)]" href="#protocol">
                  Protocol
                </a>
                <a className="transition hover:text-[color:var(--ink)]" href="#outputs">
                  Outputs
                </a>
              </nav>

              <a
                href="#modes"
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ink)] px-4 py-2 text-sm font-medium text-white transition hover:bg-black"
              >
                Open the vibe
                <ArrowUpRightIcon className="h-4 w-4" />
              </a>
            </div>
          </Panel>
        </header>

        <section
          id="top"
          className="grid gap-10 pb-12 pt-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-end lg:pb-16 lg:pt-20"
        >
          <div className="relative z-10 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--muted)] backdrop-blur">
              <SparkIcon className="h-4 w-4 text-[color:var(--accent)]" />
              creator-led, educator-backed anti-misinfo
            </div>

            <div className="space-y-6">
              <h1 className="max-w-[10.5ch] text-6xl font-semibold leading-[0.9] tracking-[-0.08em] sm:text-7xl lg:text-[6.9rem]">
                Fight the lie
                <br />
                <span className="[font-family:var(--font-display)] italic text-[color:var(--accent)]">
                  in the feed,
                </span>
                <br />
                not after.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[color:var(--muted)] sm:text-xl">
                Puentes.info is a visual civic-response webapp for creators, teachers, and campus
                organizers who need to catch political misinformation while it is still moving.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="#modes"
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-deep)]"
              >
                Explore the modes
                <ArrowUpRightIcon className="h-4 w-4" />
              </a>
              <a
                href="#outputs"
                className="inline-flex items-center gap-2 rounded-full border border-black/12 bg-white/72 px-5 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:bg-white"
              >
                See what ships
              </a>
            </div>

            <div className="flex flex-wrap gap-3 text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--muted)]">
              <span>deepfake panic</span>
              <span>campus rumor spiral</span>
              <span>voter-rule confusion</span>
              <span>receipt-first creator cuts</span>
            </div>
          </div>

          <div className="relative min-h-[29rem] sm:min-h-[34rem] lg:min-h-[42rem]">
            <div className="absolute left-6 right-12 top-8 overflow-hidden rounded-[2.8rem] border border-white/70 shadow-[0_30px_80px_rgba(15,23,38,0.22)] sm:left-10 sm:right-20 lg:left-10 lg:right-28">
              <Image
                src={photos.friends.src}
                alt={photos.friends.alt}
                width={1800}
                height={2200}
                sizes="(min-width: 1024px) 48vw, 92vw"
                className="h-[24rem] w-full object-cover sm:h-[29rem] lg:h-[34rem]"
                priority
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_20%,rgba(8,15,25,0.28)_100%)]" />
              <div className="absolute bottom-6 left-6 max-w-sm text-white">
                <p className="text-xs uppercase tracking-[0.26em] text-white/70">signal in motion</p>
                <p className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.04em]">
                  Gen Z does not need another PDF fact-check. It needs a better artifact to share.
                </p>
              </div>
              <PhotoCredit photo={photos.friends} className="absolute right-4 top-4" />
            </div>

            <div className="absolute right-2 top-0 w-40 rotate-[7deg] overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_22px_70px_rgba(15,23,38,0.2)] sm:w-52 lg:w-56">
              <Image
                src={photos.creator.src}
                alt={photos.creator.alt}
                width={900}
                height={1100}
                sizes="(min-width: 1024px) 16vw, 40vw"
                className="aspect-[4/5] w-full object-cover"
              />
              <div className="p-3 text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--muted)]">
                creator lane
              </div>
            </div>

            <div className="absolute bottom-10 left-0 w-36 -rotate-[7deg] overflow-hidden rounded-[1.9rem] border border-white/70 bg-white shadow-[0_20px_60px_rgba(15,23,38,0.18)] sm:w-48 lg:w-56">
              <Image
                src={photos.classroom.src}
                alt={photos.classroom.alt}
                width={900}
                height={1100}
                sizes="(min-width: 1024px) 16vw, 38vw"
                className="aspect-[4/5] w-full object-cover"
              />
              <div className="p-3 text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--muted)]">
                educator lane
              </div>
            </div>

            <div className="absolute bottom-0 right-10 w-32 rotate-[5deg] overflow-hidden rounded-[1.8rem] border border-white/70 bg-[#0f1726] text-white shadow-[0_24px_60px_rgba(15,23,38,0.24)] sm:w-40 lg:w-44">
              <Image
                src={photos.protest.src}
                alt={photos.protest.alt}
                width={900}
                height={1200}
                sizes="(min-width: 1024px) 14vw, 32vw"
                className="aspect-[3/4] w-full object-cover"
              />
              <div className="p-3 text-xs font-medium uppercase tracking-[0.22em] text-white/70">
                collective lane
              </div>
            </div>

            <div className="absolute left-14 top-0 rounded-full bg-[#d9ff57] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#111] shadow-[0_16px_30px_rgba(217,255,87,0.32)] sm:left-20">
              not another dashboard
            </div>
          </div>
        </section>

        <section className="overflow-hidden border-y border-black/10 bg-[#0f1726] py-3">
          <div className="marquee-track flex w-max gap-4 whitespace-nowrap pr-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#d9ff57] sm:text-sm">
            {[...tickerItems, ...tickerItems].map((item, index) => (
              <span key={`${item}-${index}`} className="flex items-center gap-4">
                {item}
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]" />
              </span>
            ))}
          </div>
        </section>

        <section className="grid gap-10 py-20 lg:grid-cols-[0.48fr_0.52fr] lg:items-center">
            <div className="relative overflow-hidden rounded-[3rem]">
              <Image
                src={photos.mural.src}
                alt={photos.mural.alt}
                width={1800}
                height={2200}
                sizes="(min-width: 1024px) 44vw, 92vw"
                className="h-[30rem] w-full object-cover sm:h-[36rem]"
              />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,15,25,0.18),rgba(8,15,25,0.58))]" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <p className="max-w-lg text-3xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-4xl">
                Rebuilt as Puentes.info and pushed further into youth culture, classrooms, and peer
                trust networks.
              </p>
            </div>
              <PhotoCredit photo={photos.mural} className="absolute right-4 top-4" />
            </div>

          <div className="space-y-8">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-[color:var(--accent-deep)]">
              The shift
            </p>
            <h2 className="max-w-2xl text-4xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-5xl lg:text-6xl">
              Less boxes.
              <br />
              <span className="[font-family:var(--font-display)] italic text-[color:var(--accent)]">
                More motion,
              </span>
              <br />
              more faces, more proof.
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-[color:var(--muted)]">
              The redesign treats misinformation response as something cultural, social, and visual.
              Big images carry the energy. Small overlays carry the evidence. The UI stops behaving
              like a dashboard and starts behaving like a live editorial object.
            </p>

            <div className="grid gap-8 sm:grid-cols-3">
              <div>
                <p className="text-5xl font-semibold tracking-[-0.08em]">01</p>
                <p className="mt-3 text-sm uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  feed-native
                </p>
              </div>
              <div>
                <p className="text-5xl font-semibold tracking-[-0.08em]">02</p>
                <p className="mt-3 text-sm uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  source-linked
                </p>
              </div>
              <div>
                <p className="text-5xl font-semibold tracking-[-0.08em]">03</p>
                <p className="mt-3 text-sm uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  human-approved
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="modes" className="py-10">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-[color:var(--accent-deep)]">
              Modes
            </p>
            <h2 className="text-4xl font-semibold tracking-[-0.06em] sm:text-5xl lg:text-6xl">
              Built for the people Gen Z already trusts.
            </h2>
            <p className="text-lg leading-8 text-[color:var(--muted)]">
              Switch the stage between creator, educator, and collective response. The image,
              tone, and outputs shift with the role, but the evidence stays fixed.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            {pathways.map((pathway) => (
              <button
                key={pathway.id}
                type="button"
                onClick={() => setActiveId(pathway.id)}
                className={joinClasses(
                  "rounded-full px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.18em] transition",
                  activeId === pathway.id
                    ? pathway.accentClass
                    : "border border-black/12 bg-white/70 text-[color:var(--ink)] hover:bg-white",
                )}
              >
                {pathway.label}
              </button>
            ))}
          </div>

          <div className="mt-8 overflow-hidden rounded-[3rem] border border-black/10 bg-[#0f1726]">
            <div className="relative min-h-[34rem] sm:min-h-[38rem]">
              <Image
                src={activePhoto.src}
                alt={activePhoto.alt}
                fill
                sizes="(min-width: 1024px) 88vw, 100vw"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,12,19,0.86)_0%,rgba(7,12,19,0.54)_45%,rgba(7,12,19,0.34)_100%)]" />
              <PhotoCredit photo={activePhoto} className="absolute right-4 top-4 z-10" />

              <div className="relative z-10 flex h-full flex-col justify-end p-6 text-white sm:p-8 lg:max-w-[72%] lg:p-12">
                <p className="text-xs font-medium uppercase tracking-[0.28em] text-white/68">
                  {activePathway.eyebrow}
                </p>
                <h3 className="mt-4 max-w-3xl text-3xl font-semibold leading-[0.94] tracking-[-0.05em] sm:text-4xl lg:text-5xl">
                  {activePathway.title}
                </h3>
                <p className="mt-5 max-w-2xl text-base leading-7 text-white/76 sm:text-lg sm:leading-8">
                  {activePathway.text}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {activePathway.outputs.map((output) => (
                    <span
                      key={output}
                      className="rounded-full border border-white/16 bg-white/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-white/88 backdrop-blur"
                    >
                      {output}
                    </span>
                  ))}
                </div>

                <div className="mt-8 grid gap-6 border-t border-white/12 pt-6 text-sm text-white/74 md:grid-cols-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">Best move</p>
                    <p className="mt-3 leading-7">{activePathway.move}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">Built for</p>
                    <p className="mt-3 leading-7">{activePathway.audience}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-[color:var(--accent-deep)]">
              Features
            </p>
            <h2 className="text-4xl font-semibold tracking-[-0.06em] sm:text-5xl lg:text-6xl">
              A live demo of how the product actually works.
            </h2>
            <p className="text-lg leading-8 text-[color:var(--muted)]">
              Pick a rumor packet, keep the current audience mode, and watch the response remix in
              place. This is the product logic, not just marketing copy.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            {packets.map((packet) => (
              <button
                key={packet.id}
                type="button"
                onClick={() => {
                  setActivePacketId(packet.id)
                  setActiveSourceIndex(0)
                }}
                className={joinClasses(
                  "rounded-full px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.18em] transition",
                  activePacketId === packet.id
                    ? "bg-[color:var(--ink)] text-white"
                    : "border border-black/12 bg-white/70 text-[color:var(--ink)] hover:bg-white",
                )}
              >
                {packet.label}
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[0.56fr_0.44fr]">
            <div className="relative overflow-hidden rounded-[3rem] bg-[#0f1726] text-white">
              <Image
                src={activePhoto.src}
                alt={activePhoto.alt}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="absolute inset-0 h-full w-full object-cover opacity-26"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,15,25,0.18),rgba(8,15,25,0.92))]" />

              <div className="relative z-10 flex min-h-[40rem] flex-col justify-between p-6 sm:p-8 lg:p-10">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-white/14 bg-white/10 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.24em] text-white/78">
                      {activePacket.pulse}
                    </span>
                    <span className={joinClasses("rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em]", activePathway.accentClass)}>
                      {activePathway.label}
                    </span>
                    <span className="rounded-full border border-white/14 bg-white/10 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.24em] text-white/78">
                      {activeResponse.format}
                    </span>
                  </div>

                  <div className="max-w-2xl space-y-3">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/56">Incoming claim</p>
                    <h3 className="text-3xl font-semibold leading-[0.96] tracking-[-0.05em] sm:text-4xl">
                      {activePacket.claim}
                    </h3>
                  </div>
                </div>

                <div className="mx-auto w-full max-w-md rounded-[2.2rem] border border-white/12 bg-white/8 p-5 backdrop-blur">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/52">Live response preview</p>
                  <p className="mt-4 text-2xl font-semibold tracking-[-0.04em]">{activeResponse.hook}</p>
                  <p className="mt-4 text-sm leading-7 text-white/76">{activeResponse.body}</p>
                  <div className="mt-5 border-t border-white/12 pt-4 text-sm leading-7 text-white/82">
                    {activeResponse.cta}
                  </div>
                </div>

                <div className="grid gap-4 border-t border-white/12 pt-5 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-white/52">Verified truth</p>
                    <p className="mt-3 text-sm leading-7 text-white/78">{activePacket.truth}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-white/52">Why it travels</p>
                    <p className="mt-3 text-sm leading-7 text-white/78">{activePacket.risk}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.28em] text-[color:var(--accent-deep)]">
                  Source ladder
                </p>
                <h3 className="mt-4 text-3xl font-semibold tracking-[-0.05em]">
                  Click the evidence chain.
                </h3>
                <p className="mt-4 text-base leading-8 text-[color:var(--muted)]">
                  Puentes.info is designed to make the proof legible. Instead of dumping links, it
                  shows what each source contributes to the correction.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {activePacket.sources.map((source, index) => (
                  <button
                    key={source.label}
                    type="button"
                    onClick={() => setActiveSourceIndex(index)}
                    className={joinClasses(
                      "rounded-full px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.18em] transition",
                      activeSourceIndex === index
                        ? "bg-[color:var(--accent)] text-white"
                        : "border border-black/12 bg-white/70 text-[color:var(--ink)] hover:bg-white",
                    )}
                  >
                    {source.label}
                  </button>
                ))}
              </div>

              <div className="overflow-hidden rounded-[2.6rem] border border-black/10 bg-white/76 p-6 shadow-[0_22px_70px_rgba(15,23,38,0.08)] backdrop-blur sm:p-8">
                <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">
                  {activeSource.type}
                </p>
                <p className="mt-4 text-2xl font-semibold tracking-[-0.04em]">{activeSource.label}</p>
                <p className="mt-4 text-base leading-8 text-[color:var(--muted)]">{activeSource.detail}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {featureStrip.map((feature) => (
                  <div key={feature.title} className="border-t border-black/10 pt-4">
                    <p className="text-lg font-semibold tracking-[-0.03em]">{feature.title}</p>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{feature.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="protocol" className="py-20">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-[color:var(--accent-deep)]">
            Protocol
          </p>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.06em] sm:text-5xl lg:text-6xl">
            A studio rhythm, not a dashboard ritual.
          </h2>

          <div className="relative mt-12">
            <div className="absolute left-0 right-0 top-12 hidden h-px bg-black/10 lg:block" />
            <div className="grid gap-10 lg:grid-cols-4">
              {protocol.map((step) => (
                <div key={step.number} className="relative">
                  <p className="text-7xl font-semibold tracking-[-0.08em] text-black/12">
                    {step.number}
                  </p>
                  <div className="mt-4 h-3 w-3 rounded-full bg-[color:var(--accent)]" />
                  <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">{step.title}</h3>
                  <p className="mt-4 text-base leading-7 text-[color:var(--muted)]">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="outputs" className="grid gap-10 py-6 lg:grid-cols-[0.56fr_0.44fr] lg:items-start">
          <div className="relative overflow-hidden rounded-[3rem] bg-[#0f1726] text-white">
            <Image
              src={photos.creator.src}
              alt={photos.creator.alt}
              fill
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="absolute inset-0 h-full w-full object-cover opacity-28"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,15,25,0.24),rgba(8,15,25,0.92))]" />
            <div className="relative z-10 flex min-h-[38rem] flex-col justify-between p-6 sm:p-8 lg:p-10">
              <div className="max-w-2xl space-y-5">
                <p className="text-xs font-medium uppercase tracking-[0.28em] text-white/60">
                  What ships
                </p>
                <h2 className="text-4xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-5xl">
                  One rumor in.
                  <br />
                  Multiple trust-ready formats out.
                </h2>
                <p className="text-base leading-8 text-white/74 sm:text-lg">
                  The same verified packet can become a creator script, a classroom prompt, and a
                  group-chat correction without losing the source trail.
                </p>
              </div>

              <div className="mx-auto w-full max-w-md rounded-[2.2rem] border border-white/12 bg-white/8 p-5 backdrop-blur">
                <p className="text-[10px] uppercase tracking-[0.28em] text-white/52">Sample creator cut</p>
                <p className="mt-4 text-2xl font-semibold tracking-[-0.04em]">
                  &ldquo;That viral clip cuts off the part where the policy actually fails.&rdquo;
                </p>
                <div className="mt-5 border-t border-white/12 pt-4 text-sm leading-7 text-white/76">
                  Hook first. Receipt second. Caption third. No jargon wall, no passive-voice blob,
                  no hiding the source in tiny print.
                </div>
              </div>

              <PhotoCredit photo={photos.creator} className="self-start" />
            </div>
          </div>

          <div className="space-y-10">
            {outputRails.map((rail, index) => (
              <div key={rail.title} className="border-b border-black/10 pb-8">
                <p className="text-6xl font-semibold tracking-[-0.08em] text-black/14">0{index + 1}</p>
                <h3 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">{rail.title}</h3>
                <p className="mt-4 text-base leading-8 text-[color:var(--muted)]">{rail.text}</p>
              </div>
            ))}

            <div className="relative overflow-hidden rounded-[2.4rem] border border-black/10">
              <Image
                src={photos.classroom.src}
                alt={photos.classroom.alt}
                width={1800}
                height={1200}
                sizes="(min-width: 1024px) 34vw, 100vw"
                className="h-[20rem] w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_15%,rgba(8,15,25,0.64)_100%)]" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <p className="max-w-lg text-2xl font-semibold tracking-[-0.04em]">
                  The best anti-misinfo tool for Gen Z is something they can learn from and repost.
                </p>
              </div>
              <PhotoCredit photo={photos.classroom} className="absolute right-4 top-4" />
            </div>
          </div>
        </section>

        <section className="pt-24">
          <div className="relative overflow-hidden rounded-[3rem] bg-[#0f1726] text-white">
            <Image
              src={photos.friends.src}
              alt={photos.friends.alt}
              fill
              sizes="(min-width: 1024px) 88vw, 100vw"
              className="absolute inset-0 h-full w-full object-cover opacity-38"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,15,25,0.9)_0%,rgba(8,15,25,0.72)_44%,rgba(8,15,25,0.42)_100%)]" />
            <div className="relative z-10 grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.68fr_0.32fr] lg:items-end lg:p-12">
              <div className="space-y-6">
                <p className="text-xs font-medium uppercase tracking-[0.28em] text-white/58">
                  Final frame
                </p>
                <h2 className="max-w-3xl text-4xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-5xl lg:text-6xl">
                  Make civic clarity feel bold enough to live in public.
                </h2>
                <p className="max-w-2xl text-base leading-8 text-white/76 sm:text-lg">
                  Puentes.info now leans into real photography, editorial scale, brighter motion, and
                  cleaner evidence language so the product feels closer to culture than compliance.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="#top"
                    className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-deep)]"
                  >
                    Back to top
                  </a>
                  <a
                    href="#modes"
                    className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/16"
                  >
                    Reopen modes
                  </a>
                </div>
              </div>

              <div className="space-y-3 text-xs uppercase tracking-[0.22em] text-white/60">
                <p>Visual credits</p>
                <a className="block transition hover:text-white" href={photos.friends.href} target="_blank" rel="noreferrer">
                  Omar Lopez / Unsplash
                </a>
                <a className="block transition hover:text-white" href={photos.creator.href} target="_blank" rel="noreferrer">
                  Akhil Yerabati / Unsplash
                </a>
                <a className="block transition hover:text-white" href={photos.classroom.href} target="_blank" rel="noreferrer">
                  Vitaly Gariev / Unsplash
                </a>
                <a className="block transition hover:text-white" href={photos.protest.href} target="_blank" rel="noreferrer">
                  Desiray Green / Unsplash
                </a>
                <a className="block transition hover:text-white" href={photos.mural.href} target="_blank" rel="noreferrer">
                  ayumi kubo / Unsplash
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
