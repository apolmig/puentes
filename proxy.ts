import { NextRequest, NextResponse } from "next/server"

const protectedPrefixes = ["/api/packets", "/inbox", "/packets", "/studio", "/review", "/exports"]
const mutatingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"])

function isHostedRuntime() {
  return process.env.NETLIFY === "true" || process.env.PUENTES_HOSTED_RUNTIME === "true"
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false
  }

  let mismatch = 0
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }

  return mismatch === 0
}

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Puentes Workspace", charset="UTF-8"',
    },
  })
}

function hasValidBasicAuth(request: NextRequest) {
  const password = process.env.PUENTES_WORKSPACE_PASSWORD?.trim()

  if (!password) {
    return !isHostedRuntime()
  }

  const expectedUser = process.env.PUENTES_WORKSPACE_USER?.trim() || "puentes"
  const authorization = request.headers.get("authorization")

  if (!authorization?.startsWith("Basic ")) {
    return false
  }

  try {
    const decoded = atob(authorization.slice("Basic ".length))
    const separator = decoded.indexOf(":")

    if (separator < 0) {
      return false
    }

    const user = decoded.slice(0, separator)
    const candidatePassword = decoded.slice(separator + 1)

    return timingSafeEqual(user, expectedUser) && timingSafeEqual(candidatePassword, password)
  } catch {
    return false
  }
}

function hasSameOriginMutation(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/") || !mutatingMethods.has(request.method)) {
    return true
  }

  const secFetchSite = request.headers.get("sec-fetch-site")
  if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "none") {
    return false
  }

  const origin = request.headers.get("origin")
  if (!origin) {
    return true
  }

  return origin === request.nextUrl.origin
}

export function proxy(request: NextRequest) {
  if (!protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  if (!hasValidBasicAuth(request)) {
    if (!process.env.PUENTES_WORKSPACE_PASSWORD?.trim() && isHostedRuntime()) {
      return new NextResponse("Workspace password is not configured", { status: 503 })
    }

    return unauthorized()
  }

  if (!hasSameOriginMutation(request)) {
    return new NextResponse("Cross-origin workspace mutation rejected", { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/api/packets/:path*",
    "/inbox/:path*",
    "/packets/:path*",
    "/studio/:path*",
    "/review/:path*",
    "/exports/:path*",
  ],
}
