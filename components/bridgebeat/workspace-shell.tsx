"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

const navItems = [
  { href: "/inbox", label: "Inbox" },
  { href: "/packets", label: "Packets" },
]

function isActive(pathname: string, href: string) {
  if (href === "/packets") {
    return pathname.startsWith("/packets") || pathname.startsWith("/studio") || pathname.startsWith("/review") || pathname.startsWith("/exports")
  }

  return pathname === href
}

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[96rem] px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-40">
          <div className="glass-panel rounded-[2rem] px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-sm font-semibold text-white"
                >
                  PI
                </Link>
                <div>
                  <p className="text-lg font-semibold tracking-[-0.04em]">Puentes.info Workspace</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                    Creator studio for civic response
                  </p>
                </div>
              </div>

              <nav className="flex flex-wrap gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      isActive(pathname, item.href)
                        ? "rounded-full bg-[color:var(--ink)] px-4 py-2 text-sm font-semibold text-white"
                        : "rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm font-semibold text-[color:var(--ink)] transition hover:bg-white"
                    }
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </header>

        <div className="pt-8">{children}</div>
      </div>
    </div>
  )
}
