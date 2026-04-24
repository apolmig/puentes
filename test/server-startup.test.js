const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs/promises");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");
const test = require("node:test");

const seedStore = require("../seed-data");

const rootDir = path.resolve(__dirname, "..");
const dataFile = path.join(rootDir, "data", "store.json");

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getFreePort() {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  return port;
}

function readJson(port, pathname) {
  return new Promise((resolve, reject) => {
    const request = http.get({
      host: "127.0.0.1",
      port,
      path: pathname,
      timeout: 500
    }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        try {
          resolve({
            statusCode: response.statusCode,
            body: JSON.parse(body)
          });
        } catch (error) {
          reject(error);
        }
      });
    });

    request.on("timeout", () => {
      request.destroy(new Error("Request timed out"));
    });
    request.on("error", reject);
  });
}

async function waitForBootstrap(child, port, getLogs) {
  const deadline = Date.now() + 5000;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Server exited early with code ${child.exitCode}.\n${getLogs()}`);
    }

    try {
      return await readJson(port, "/api/bootstrap");
    } catch (error) {
      await delay(100);
    }
  }

  throw new Error(`Timed out waiting for server bootstrap.\n${getLogs()}`);
}

async function preserveDataFile() {
  try {
    return {
      existed: true,
      contents: await fs.readFile(dataFile)
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        existed: false,
        contents: null
      };
    }
    throw error;
  }
}

async function restoreDataFile(snapshot) {
  if (snapshot.existed) {
    await fs.writeFile(dataFile, snapshot.contents);
  } else {
    await fs.rm(dataFile, { force: true });
  }
}

async function dataFileExists() {
  try {
    await fs.access(dataFile);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function stopProcess(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  const exited = new Promise((resolve) => child.once("exit", () => resolve(true)));
  child.kill();

  if (await Promise.race([exited, delay(2000).then(() => false)])) {
    return;
  }

  if (child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    await Promise.race([
      new Promise((resolve) => child.once("exit", resolve)),
      delay(1000)
    ]);
  }
}

test("server starts and imports its bootstrap dependencies", async () => {
  const snapshot = await preserveDataFile();
  const port = await getFreePort();
  const child = spawn(process.execPath, ["server.js"], {
    cwd: rootDir,
    env: {
      ...process.env,
      PORT: String(port)
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let stdout = "";
  let stderr = "";

  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  try {
    const response = await waitForBootstrap(child, port, () => `${stdout}\n${stderr}`);
    const packetIds = seedStore.packets.map((packet) => packet.id).sort();

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.backend.mode, "file");
    assert.equal(response.body.workspace.activePacketId, seedStore.workspace.activePacketId);
    assert.deepEqual(Object.keys(response.body.workspace.workspaceStateByPacket).sort(), packetIds);
    assert.match(stdout, new RegExp(`Puentes listening on http://127\\.0\\.0\\.1:${port}`));
    assert.equal(stderr, "");
  } finally {
    await stopProcess(child);
    await restoreDataFile(snapshot);
    assert.equal(await dataFileExists(), snapshot.existed);
  }
});
