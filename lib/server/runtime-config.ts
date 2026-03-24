function pickFirstEnv(names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim()

    if (value) {
      return value
    }
  }

  return undefined
}

function parseBoolean(value: string) {
  return ["1", "true", "yes", "on"].includes(value.toLowerCase())
}

export function isProductionDeployment() {
  const hostedOverride = process.env.PUENTES_HOSTED_RUNTIME?.trim()

  if (hostedOverride) {
    return parseBoolean(hostedOverride)
  }

  return process.env.NETLIFY === "true"
}

export function shouldSeedPackets() {
  const explicit = pickFirstEnv(["PUENTES_ENABLE_SEED", "BRIDGEBEAT_ENABLE_SEED"])

  if (explicit !== undefined) {
    return parseBoolean(explicit)
  }

  return !isProductionDeployment()
}

export function getDatabaseRuntimeConfig() {
  const url =
    pickFirstEnv(["TURSO_DATABASE_URL", "PUENTES_DATABASE_URL", "BRIDGEBEAT_DATABASE_URL"]) ??
    "file:./data/puentes.db"
  const authToken = pickFirstEnv([
    "TURSO_AUTH_TOKEN",
    "PUENTES_DATABASE_AUTH_TOKEN",
    "BRIDGEBEAT_DATABASE_AUTH_TOKEN",
  ])
  const isLocal = url.startsWith("file:")

  if (!isLocal && !authToken) {
    throw new Error(
      "Remote database configuration is incomplete. Set TURSO_AUTH_TOKEN or PUENTES_DATABASE_AUTH_TOKEN.",
    )
  }

  if (isProductionDeployment() && isLocal) {
    throw new Error(
      "Local SQLite is disabled in production. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.",
    )
  }

  return {
    url,
    authToken,
    isLocal,
  }
}

export function getCloudinaryRuntimeConfig() {
  const cloudName = pickFirstEnv(["CLOUDINARY_CLOUD_NAME"])
  const apiKey = pickFirstEnv(["CLOUDINARY_API_KEY"])
  const apiSecret = pickFirstEnv(["CLOUDINARY_API_SECRET"])
  const configuredValues = [cloudName, apiKey, apiSecret].filter(Boolean).length

  if (configuredValues === 0) {
    if (isProductionDeployment()) {
      throw new Error(
        "Hosted uploads are required in production. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
      )
    }

    return null
  }

  if (configuredValues !== 3 || !cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary configuration is incomplete. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    )
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
  }
}
