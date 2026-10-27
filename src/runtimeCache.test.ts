import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWork } from "./demo";
import { initialRuntime } from "./schema";
import { checkpoint, restoreCheckpoint } from "./runtimeCache";

describe("immediate progress checkpoints", () => {
  const memory = new Map<string, string>();
  beforeEach(() => {
    memory.clear();
    vi.stubGlobal("localStorage", { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value) });
  });
  afterEach(() => vi.unstubAllGlobals());
  it("restores the current app and latest changes immediately", () => {
    const work = createWork();
    const state = initialRuntime(work);
    state.navigation = { app: "notes", locked: false };
    state.ui = { notes: { "navigation:detail": "note-one", "note-body:note-one": "已编辑内容" } };
    checkpoint(state);
    expect(restoreCheckpoint(work)).toEqual(state);
  });
  it("ignores incompatible revisions and corrupt saves", () => {
    const work = createWork();
    checkpoint(initialRuntime(work));
    expect(restoreCheckpoint({ ...work, updatedAt: work.updatedAt + 1 })).toBeUndefined();
    memory.set(`foundphone-progress:${work.id}`, "not-json");
    expect(restoreCheckpoint(work)).toBeUndefined();
  });
  it("keeps IndexedDB usable if the synchronous cache is unavailable", () => {
    vi.stubGlobal("localStorage", { setItem: () => { throw Error("quota"); }, getItem: () => { throw Error("blocked"); } });
    const work = createWork();
    expect(() => checkpoint(initialRuntime(work))).not.toThrow();
    expect(restoreCheckpoint(work)).toBeUndefined();
  });
});
