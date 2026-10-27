import type { Runtime, Work } from "./schema";

const key = (id: string) => `foundphone-progress:${id}`;

// Synchronous checkpoint covers closing the page before IndexedDB finishes.
export function checkpoint(state: Runtime) {
  try {
    localStorage.setItem(key(state.workId), JSON.stringify(state));
  } catch {
    // IndexedDB remains the primary save when localStorage is unavailable/full.
  }
}

export function restoreCheckpoint(work: Work): Runtime | undefined {
  try {
    const raw = localStorage.getItem(key(work.id));
    if (!raw) return;
    const state = JSON.parse(raw) as Runtime;
    if (state.workId !== work.id || state.revision !== work.updatedAt) return;
    if (!state.variables || !state.messages || typeof state.time !== "string") return;
    if (![state.read, state.visited, state.unlocked, state.hidden, state.completed, state.clues, state.endings, state.notifications, state.choices, state.trace].every(Array.isArray)) return;
    return state;
  } catch {
    return;
  }
}
