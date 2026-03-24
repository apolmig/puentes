import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Fraunces, IBM_Plex_Mono, Space_Grotesk } from "next/font/google"

import "./globals.css"
import { PacketStoreProvider } from "@/components/bridgebeat/packet-store-provider"
import { ThemeProvider } from "@/components/theme-provider"

const fontSans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
})

const fontDisplay = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
})

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-code",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://puentes.info"),
  title: "Puentes.info | Creator Studio for Civic Response",
  description:
    "Puentes.info is a creator-and-educator civic-response studio for turning fast-moving political misinformation into source-linked, share-ready clarity.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} font-sans antialiased`}
    >
      <body>
        <ThemeProvider>
          <PacketStoreProvider>{children}</PacketStoreProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
