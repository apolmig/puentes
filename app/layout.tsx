import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"

import "./globals.css"
import { PacketStoreProvider } from "@/components/bridgebeat/packet-store-provider"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  metadataBase: new URL("https://puentes.info"),
  title: "Puentes.info | Civic Response Studio for Creators, Educators, and Organizers",
  description:
    "Catch fast-moving civic rumors, verify the record, and ship source-linked responses for feeds, classrooms, and community networks.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Puentes.info | Civic Response Studio for Creators, Educators, and Organizers",
    description:
      "Catch fast-moving civic rumors, verify the record, and ship source-linked responses for feeds, classrooms, and community networks.",
    url: "/",
    siteName: "Puentes.info",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Puentes.info social card showing source-linked civic response for creators and educators.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Puentes.info | Civic Response Studio for Creators, Educators, and Organizers",
    description:
      "Catch civic rumors early and turn them into source-linked responses people can trust and resend.",
    images: [
      {
        url: "/twitter-image.png",
        alt: "Puentes.info social card showing source-linked civic response for creators and educators.",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-icon.png" }],
  },
}

export const viewport: Viewport = {
  themeColor: "#ff6b3d",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="font-sans antialiased">
      <body>
        <ThemeProvider>
          <PacketStoreProvider>{children}</PacketStoreProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
