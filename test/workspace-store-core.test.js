const assert = require("node:assert/strict");
const test = require("node:test");

const seedStore = require("../seed-data");
const { normalizeStore } = require("../lib/workspace-store-core");

test("normalizeStore(seedStore) returns a complete normalized workspace", () => {
  const normalized = normalizeStore(seedStore);
  const packetIds = seedStore.packets.map((packet) => packet.id);

  assert.equal(normalized.meta.version, 4);
  assert.equal(normalized.workspace.activePacketId, seedStore.workspace.activePacketId);
  assert.deepEqual(normalized.audiences.map((audience) => audience.id), seedStore.audiences.map((audience) => audience.id));
  assert.deepEqual(normalized.packets.map((packet) => packet.id), packetIds);
  assert.deepEqual(Object.keys(normalized.workspace.workspaceStateByPacket).sort(), [...packetIds].sort());
  assert.deepEqual(normalized.workspace.queue, seedStore.workspace.queue);
  assert.ok(Date.parse(normalized.workspace.lastSavedAt));

  for (const packet of seedStore.packets) {
    const expected = seedStore.createWorkspaceState(packet.id);
    const actual = normalized.workspace.workspaceStateByPacket[packet.id];

    assert.equal(actual.selectedAudienceId, expected.selectedAudienceId);
    assert.equal(actual.selectedClaimIndex, expected.selectedClaimIndex);
    assert.equal(actual.selectedFormat, expected.selectedFormat);
    assert.equal(actual.reviewStatus, expected.reviewStatus);
    assert.equal(actual.packagingPreset, expected.packagingPreset);
    assert.deepEqual(actual.exportedFormats, []);
    assert.equal(actual.shareReady, false);
    assert.equal(actual.shareUrl, "");
    assert.deepEqual(actual.generatedBundlesByFormat, {});
    assert.deepEqual(actual.checklist, seedStore.baseChecklist.map((item) => ({ ...item, done: false })));
    assert.ok(Array.isArray(actual.history));
    assert.ok(actual.history.length > 0);
    assert.ok(actual.aiSettings.textModel);
    assert.ok(actual.aiSettings.reviewModel);
    assert.ok(actual.aiSettings.imageModel);
    assert.ok(actual.aiSettings.videoModel);
  }
});

test("normalizeStore(seedStore) returns cloned app data", () => {
  const normalized = normalizeStore(seedStore);
  const activePacketId = normalized.workspace.activePacketId;

  assert.notEqual(normalized, seedStore);
  assert.notEqual(normalized.audiences, seedStore.audiences);
  assert.notEqual(normalized.packets, seedStore.packets);
  assert.notEqual(
    normalized.workspace.workspaceStateByPacket[activePacketId],
    seedStore.workspace.workspaceStateByPacket[activePacketId]
  );
  assert.notEqual(
    normalized.workspace.workspaceStateByPacket[activePacketId].checklist,
    seedStore.workspace.workspaceStateByPacket[activePacketId].checklist
  );
});
