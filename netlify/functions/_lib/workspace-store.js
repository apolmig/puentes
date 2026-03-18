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

function useFileStore() {
  return process.env.PUENTES_STORE_BACKEND === "file";
}

function ensureStoreFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(normalizeStore(seedStore), null, 2));
  }
}

function loadStore() {
  if (!useFileStore()) {
    return normalizeStore(seedStore);
  }

  ensureStoreFile();
  return normalizeStore(JSON.parse(fs.readFileSync(dataFile, "utf8")));
}

function saveStore(store) {
  const normalized = normalizeStore(store);

  if (useFileStore()) {
    ensureStoreFile();
    fs.writeFileSync(dataFile, JSON.stringify(normalized, null, 2));
  }

  return normalized;
}

function assertPersistentStore() {
  if (!useFileStore()) {
    throw createError(
      501,
      "Persistent workspace storage is not configured for Netlify Functions. Keep using local demo mode or add a real database adapter."
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

