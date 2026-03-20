const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");
const seedStore = require(path.join(__dirname, "..", "..", "seed-data"));

const host = "127.0.0.1";
const rootDir = path.join(__dirname, "..", "..");
const staticFiles = {
  "/": { file: "index.html", type: "text/html; charset=utf-8" },
  "/index.html": { file: "index.html", type: "text/html; charset=utf-8" },
  "/seed-data.js": { file: "seed-data.js", type: "application/javascript; charset=utf-8" },
  "/styles.css": { file: "styles.css", type: "text/css; charset=utf-8" },
  "/script.js": { file: "script.js", type: "application/javascript; charset=utf-8" }
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createStore() {
  return clone(seedStore);
}

function getWorkspace(store, packetId = store.workspace.activePacketId) {
  if (!store.workspace.workspaceStateByPacket[packetId]) {
    store.workspace.workspaceStateByPacket[packetId] = seedStore.createWorkspaceState(packetId);
  }
  return store.workspace.workspaceStateByPacket[packetId];
}

function appendHistory(store, packetId, action, detail) {
  if (!action) {
    return;
  }
  const workspace = getWorkspace(store, packetId || store.workspace.activePacketId);
  const entry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    action,
    detail: detail || ""
  };
  workspace.history = [entry, ...(workspace.history || [])].slice(0, 12);
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function sendFile(response, pathname) {
  const asset = staticFiles[pathname];
  if (!asset) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const filePath = path.join(rootDir, asset.file);
  response.writeHead(200, {
    "Content-Type": asset.type,
    "Cache-Control": "no-store"
  });
  response.end(fs.readFileSync(filePath));
}

async function readJson(request) {
  return await new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

async function startServer() {
  const store = createStore();
  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", `http://${host}`);

      if (request.method === "GET" && url.pathname === "/api/bootstrap") {
        sendJson(response, 200, store);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/state") {
        const body = await readJson(request);
        const appPatch = body.appPatch && typeof body.appPatch === "object" ? body.appPatch : {};
        const packetId = typeof body.packetId === "string"
          ? body.packetId
          : typeof appPatch.activePacketId === "string"
            ? appPatch.activePacketId
            : store.workspace.activePacketId;
        const workspacePatch = body.workspacePatch && typeof body.workspacePatch === "object" ? body.workspacePatch : {};

        Object.assign(store.workspace, clone(appPatch));
        Object.assign(getWorkspace(store, packetId), clone(workspacePatch));
        store.workspace.lastSavedAt = new Date().toISOString();
        appendHistory(store, packetId, body.action, body.detail);
        sendJson(response, 200, { workspace: store.workspace });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/queue") {
        const body = await readJson(request);
        const question = typeof body.question === "string" ? body.question.trim() : "";
        if (!question) {
          sendJson(response, 400, { error: "Question is required." });
          return;
        }
        store.workspace.queue = [question, ...(store.workspace.queue || [])].slice(0, 8);
        store.workspace.lastSavedAt = new Date().toISOString();
        appendHistory(store, store.workspace.activePacketId, "Queued question", question);
        sendJson(response, 200, { workspace: store.workspace });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/video-status") {
        sendJson(response, 200, { status: "pending" });
        return;
      }

      if (request.method === "GET" && url.pathname === "/favicon.ico") {
        response.writeHead(204);
        response.end();
        return;
      }

      sendFile(response, url.pathname);
    } catch (error) {
      sendJson(response, 500, { error: error.message || "Internal server error" });
    }
  });

  await new Promise((resolve) => server.listen(0, host, resolve));
  const address = server.address();
  return {
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
    url: `http://${host}:${address.port}`
  };
}

function record(results, name, pass, detail) {
  results.checks.push({ name, pass, detail });
}

async function verifyAnchor(page, results, name, href, targetSelector) {
  await page.locator(`a[href="${href}"]`).first().click();
  await page.waitForFunction(
    ({ selector, expectedHash }) => {
      const element = document.querySelector(selector);
      if (!element || window.location.hash !== expectedHash) {
        return false;
      }
      const rect = element.getBoundingClientRect();
      return rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
    },
    { selector: targetSelector, expectedHash: href },
    { timeout: 3000 }
  );
  const hash = await page.evaluate(() => window.location.hash);
  const metrics = await page.locator(targetSelector).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      bottom: rect.bottom,
      height: rect.height,
      innerHeight: window.innerHeight
    };
  });
  const visible = metrics.height > 0 && metrics.bottom > 0 && metrics.top < metrics.innerHeight;
  record(results, `${name} anchor`, hash === href && visible, `hash=${hash}, top=${Math.round(metrics.top)}`);
}

async function main() {
  const outputDir = __dirname;
  const results = {
    baseUrl: "",
    checks: [],
    consoleErrors: [],
    consoleWarnings: [],
    pageErrors: [],
    requestFailures: [],
    screenshots: []
  };

  const server = await startServer();
  results.baseUrl = server.url;

  const browser = await chromium.launch({
    executablePath: fs.existsSync("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe")
      ? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
      : "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true
  });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
    const page = await context.newPage();

    page.on("console", (message) => {
      if (message.type() === "error") {
        results.consoleErrors.push(message.text());
      }
      if (message.type() === "warning") {
        results.consoleWarnings.push(message.text());
      }
    });
    page.on("pageerror", (error) => results.pageErrors.push(error.message));
    page.on("requestfailed", (request) => {
      const failure = request.failure();
      results.requestFailures.push(`${request.method()} ${request.url()} :: ${failure ? failure.errorText : "unknown"}`);
    });

    await page.goto(server.url, { waitUntil: "networkidle" });
    await page.waitForSelector("#audience-tabs button");

    const heroText = await page.locator("h1").first().textContent();
    record(
      results,
      "Home hero renders",
      heroText === "Turn a political fake-news spike into a clean, source-linked response.",
      heroText || await page.title()
    );

    const heroClaim = await page.locator("#visual-claim").textContent();
    record(
      results,
      "Detector layer renders",
      typeof heroClaim === "string" && heroClaim.includes("The vote removed all tenant protections"),
      heroClaim
    );

    const audienceCount = await page.locator("#audience-tabs button").count();
    const stepCount = await page.locator(".step-card").count();
    const packetCount = await page.locator("#packet-list button").count();
    record(
      results,
      "Workspace bootstrap renders",
      audienceCount === 3 && stepCount === 4 && packetCount === 3,
      `audiences=${audienceCount}, steps=${stepCount}, packets=${packetCount}`
    );

    await verifyAnchor(page, results, "Use cases", "#mission", "#mission");
    await verifyAnchor(page, results, "Workspace", "#workspace", "#workspace");
    await verifyAnchor(page, results, "Trust", "#safeguards", "#safeguards");
    await verifyAnchor(page, results, "Blueprint", "#blueprint", "#blueprint");

    await page.locator("a[href='#workspace']").first().click();
    await page.waitForTimeout(150);
    await page.locator("#step-intake-card").click();
    await page.locator("#question-input").waitFor({ state: "visible" });
    await page.locator("[data-audience-id='educator']").click();
    await page.waitForTimeout(150);
    const audienceTitle = await page.locator("#audience-title").textContent();
    record(
      results,
      "Audience mode switch works",
      audienceTitle === "For classrooms, clubs, and guided discussion",
      audienceTitle
    );

    await page.locator("#step-intake-card").click();
    await page.locator("#question-input").waitFor({ state: "visible" });
    const queuedQuestion = "Playwright smoke test question about the transit budget";
    await page.locator("#question-input").fill(queuedQuestion);
    await page.locator("#queue-question").click();
    await page.waitForTimeout(150);
    const firstQueueItem = await page.locator("#queue-list li").first().textContent();
    record(
      results,
      "Queue submission works",
      typeof firstQueueItem === "string" && firstQueueItem.includes(queuedQuestion),
      firstQueueItem
    );

    await page.locator("#step-intake-card").click();
    await page.locator("#load-next-packet").waitFor({ state: "visible" });
    await page.locator("#load-next-packet").click();
    await page.waitForTimeout(150);
    await page.locator("#step-verify-card").click();
    await page.locator("#packet-title").waitFor({ state: "visible" });
    const packetTitle = await page.locator("#packet-title").textContent();
    record(results, "Packet switching works", packetTitle === "Transit budget packet", packetTitle);

    await page.locator("[data-claim-index='1']").click();
    await page.waitForTimeout(150);
    const claimTitle = await page.locator("#claim-title").textContent();
    record(results, "Claim switching works", claimTitle === "The agency ignored public comment entirely.", claimTitle);

    await page.locator("#step-draft-card").click();
    await page.locator("#draft-title").waitFor({ state: "visible" });
    await page.locator("[data-format='video']").click();
    await page.waitForTimeout(150);
    const draftTitle = await page.locator("#draft-title").textContent();
    record(results, "Format switching works", draftTitle === "A 30-second map myth check", draftTitle);

    await page.locator("#step-export-card").click();
    await page.locator("#reviewer-notes").waitFor({ state: "visible" });
    const noteText = "Smoke test note saved from Playwright.";
    await page.locator("#reviewer-notes").fill(noteText);
    await page.locator("#save-note").click();
    await page.waitForTimeout(150);
    const savedNote = await page.locator("#reviewer-notes").inputValue();
    const historyText = (await page.locator("#history-list").textContent()) || "";
    record(
      results,
      "Reviewer notes save",
      savedNote === noteText && historyText.includes("Saved reviewer note"),
      historyText
    );

    for (const id of ["sources", "tone", "risks"]) {
      await page.locator(`[data-check-id='${id}']`).check();
      await page.waitForTimeout(100);
    }
    await page.locator("#approve-review").click();
    await page.waitForTimeout(150);
    const gateTitle = await page.locator("#gate-status-title").textContent();
    const exportStatus = await page.locator("#export-handoff-status").textContent();
    const exportSummary = await page.locator("#export-summary").textContent();
    const correctionMode = await page.locator("#export-packaging").textContent();
    record(
      results,
      "Approval gate updates",
      gateTitle === "Ready to share" &&
        exportStatus === "Share ready" &&
        typeof correctionMode === "string" &&
        correctionMode.trim().length > 5 &&
        typeof exportSummary === "string" &&
        exportSummary.includes("ready for creator mode"),
      `${gateTitle} / ${exportStatus} / ${correctionMode} / ${exportSummary}`
    );

    const shareUrl = await page.locator("#share-link").textContent();
    const sharePage = await context.newPage();
    await sharePage.goto((shareUrl || "").trim(), { waitUntil: "networkidle" });
    const shareView = await sharePage.evaluate(() => ({
      readonlyBannerHidden: document.querySelector("#readonly-banner")?.hidden,
      shareArtifactHidden: document.querySelector("#share-artifact")?.hidden,
      shareModeClass: document.body.classList.contains("is-share-mode"),
      stepRailDisplay: window.getComputedStyle(document.querySelector(".step-rail")).display
    }));
    record(
      results,
      "Public share mode renders",
      shareView.readonlyBannerHidden === false &&
        shareView.shareArtifactHidden === false &&
        shareView.shareModeClass === true &&
        shareView.stepRailDisplay === "none",
      JSON.stringify(shareView)
    );
    await sharePage.close();

    const desktopShot = path.join(outputDir, "desktop-smoke.png");
    await page.screenshot({ path: desktopShot, fullPage: true });
    results.screenshots.push(desktopShot);

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    });
    const mobilePage = await mobileContext.newPage();
    mobilePage.on("console", (message) => {
      if (message.type() === "error") {
        results.consoleErrors.push(`[mobile] ${message.text()}`);
      }
    });
    mobilePage.on("pageerror", (error) => results.pageErrors.push(`[mobile] ${error.message}`));

    await mobilePage.goto(server.url, { waitUntil: "networkidle" });
    await mobilePage.locator(".hero-actions a[href='#workspace']").click();
    await mobilePage.waitForTimeout(150);

    const mobileLayout = await mobilePage.evaluate(() => ({
      navDisplay: window.getComputedStyle(document.querySelector(".site-nav")).display,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      hash: window.location.hash
    }));
    record(
      results,
      "Mobile layout holds",
      mobileLayout.navDisplay === "none" &&
        mobileLayout.hash === "#workspace" &&
        mobileLayout.scrollWidth <= mobileLayout.innerWidth + 1,
      JSON.stringify(mobileLayout)
    );

    const mobileShot = path.join(outputDir, "mobile-smoke.png");
    await mobilePage.screenshot({ path: mobileShot, fullPage: true });
    results.screenshots.push(mobileShot);

    await mobileContext.close();
    await context.close();
  } finally {
    await browser.close();
    await server.close();
  }

  process.stdout.write(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
