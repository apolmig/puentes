const fs = require("fs");
const path = require("path");
const seedStore = require("../../../seed-data");
const {
  normalizeStore,
  updateWorkspaceStore: updateWorkspaceStoreCore,
  queueQuestion: queueQuestionCore
} = require("../../../lib/workspace-store-core");
const { createError } = require("./http");

const rootDir = path.resolve(__dirname, "../../..");
const dataDir = path.join(rootDir, "data");
const dataFile = path.join(dataDir, "store.json");

function localNetlifyDevRuntime() {
  return process.env.NETLIFY_DEV === "true" || process.env.CONTEXT === "dev";
}

function hostedNetlifyRuntime() {
  return !localNetlifyDevRuntime()
    && (
      process.env.NETLIFY === "true"
      || ["production", "deploy-preview", "branch-deploy"].includes(process.env.CONTEXT)
    );
}

function useFileStore() {
  return process.env.PUENTES_STORE_BACKEND === "file" && !hostedNetlifyRuntime();
}

function seedWorkspaceStore() {
  return normalizeStore(seedStore);
}

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function writeJsonFileAtomic(filePath, payload) {
  ensureDataDir();

  const dir = path.dirname(filePath);
  const tempFile = path.join(
    dir,
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`
  );

  try {
    fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2), "utf8");
    fs.renameSync(tempFile, filePath);
  } catch (error) {
    try {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    } catch (cleanupError) {
      console.warn(`Failed to remove temp store file ${tempFile}: ${cleanupError.message}`);
    }
    throw error;
  }
}

function backupCorruptStoreFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = `${filePath}.corrupt-${stamp}-${process.pid}`;

  try {
    fs.renameSync(filePath, backupFile);
  } catch (error) {
    console.warn(`Failed to move corrupt store file aside: ${error.message}`);
  }
}

function recoverStoreFile(error) {
  console.warn(`Recovering workspace store from seed data: ${error.message}`);
  backupCorruptStoreFile(dataFile);
  const fallback = seedWorkspaceStore();
  writeJsonFileAtomic(dataFile, fallback);
  return fallback;
}

function ensureStoreFile() {
  ensureDataDir();

  if (!fs.existsSync(dataFile)) {
    writeJsonFileAtomic(dataFile, seedWorkspaceStore());
  }
}

function loadStore() {
  if (!useFileStore()) {
    throw createError(
      503,
      "Persistent workspace storage is not configured for this backend. Load the static demo instead."
    );
  }

  ensureStoreFile();

  try {
    return normalizeStore(JSON.parse(fs.readFileSync(dataFile, "utf8")));
  } catch (error) {
    return recoverStoreFile(error);
  }
}

function saveStore(store) {
  const normalized = normalizeStore(store);

  if (useFileStore()) {
    writeJsonFileAtomic(dataFile, normalized);
  }

  return normalized;
}

function assertPersistentStore() {
  if (!useFileStore()) {
    const message = hostedNetlifyRuntime() && process.env.PUENTES_STORE_BACKEND === "file"
      ? "File workspace storage is disabled on hosted Netlify. Use local dev or configure a persistent adapter."
      : "Persistent workspace storage is not configured for Netlify Functions. Keep using local demo mode or add a real database adapter.";

    throw createError(
      501,
      message
    );
  }
}

function updateWorkspaceStore(body) {
  assertPersistentStore();
  return saveStore(updateWorkspaceStoreCore(loadStore(), body));
}

function queueQuestion(body) {
  assertPersistentStore();
  try {
    return saveStore(queueQuestionCore(loadStore(), body));
  } catch (error) {
    if (error.statusCode) {
      throw createError(error.statusCode, error.message);
    }
    throw error;
  }
}

module.exports = {
  loadStore,
  updateWorkspaceStore,
  queueQuestion,
  useFileStore
};

