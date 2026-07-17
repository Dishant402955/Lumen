import type { EditorSnapshot } from "@/lib/editor-types";
import { HISTORY_LIMIT } from "@/lib/editor-types";

export type HistoryState = {
  past: EditorSnapshot[];
  present: EditorSnapshot;
  future: EditorSnapshot[];
};

export function initHistory(present: EditorSnapshot): HistoryState {
  return { past: [], present, future: [] };
}

export function pushHistory(
  state: HistoryState,
  next: EditorSnapshot,
): HistoryState {
  const past = [...state.past, state.present].slice(-HISTORY_LIMIT);
  return { past, present: next, future: [] };
}

export function undoHistory(state: HistoryState): HistoryState | null {
  if (state.past.length === 0) return null;
  const past = [...state.past];
  const present = past.pop()!;
  return {
    past,
    present,
    future: [state.present, ...state.future],
  };
}

export function redoHistory(state: HistoryState): HistoryState | null {
  if (state.future.length === 0) return null;
  const [present, ...future] = state.future;
  return {
    past: [...state.past, state.present],
    present,
    future,
  };
}

export function cloneDoc<T>(value: T): T {
  return structuredClone(value);
}
