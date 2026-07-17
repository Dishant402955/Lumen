import type { EditorDoc } from "@/lib/editor-types";
import { idbRequest, idbTransactionDone, openDb } from "@/lib/offline/idb";

const DB_NAME = "lumen-offline";
const DB_VERSION = 1;
const STORE = "projects";
export const MAX_RECENT_PROJECTS = 16;

export type StoredProjectMeta = {
  id: string;
  name: string;
  updatedAt: number;
  width: number;
  height: number;
  /** JPEG thumbnail for the projects list */
  thumbnail: Blob;
};

export type StoredProject = StoredProjectMeta & {
  doc: EditorDoc;
  /** Background bitmap (PNG). */
  background: Blob;
  /** Paint layer id → PNG blob */
  paints: Record<string, Blob>;
};

function upgrade(db: IDBDatabase) {
  if (!db.objectStoreNames.contains(STORE)) {
    const store = db.createObjectStore(STORE, { keyPath: "id" });
    store.createIndex("updatedAt", "updatedAt", { unique: false });
  }
}

async function db() {
  return openDb(DB_NAME, DB_VERSION, upgrade);
}

export async function listRecentProjects(): Promise<StoredProjectMeta[]> {
  const database = await db();
  const tx = database.transaction(STORE, "readonly");
  const store = tx.objectStore(STORE);
  const all = await idbRequest(store.getAll() as IDBRequest<StoredProject[]>);
  await idbTransactionDone(tx);
  return all
    .map(({ id, name, updatedAt, width, height, thumbnail }) => ({
      id,
      name,
      updatedAt,
      width,
      height,
      thumbnail,
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getProject(id: string): Promise<StoredProject | null> {
  const database = await db();
  const tx = database.transaction(STORE, "readonly");
  const project = await idbRequest(
    tx.objectStore(STORE).get(id) as IDBRequest<StoredProject | undefined>,
  );
  await idbTransactionDone(tx);
  return project ?? null;
}

export async function saveProject(project: StoredProject): Promise<void> {
  const database = await db();
  const tx = database.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  await idbRequest(store.put(project));

  // Enforce max count (oldest first)
  const all = await idbRequest(store.getAll() as IDBRequest<StoredProject[]>);
  if (all.length > MAX_RECENT_PROJECTS) {
    const sorted = [...all].sort((a, b) => a.updatedAt - b.updatedAt);
    const removeCount = all.length - MAX_RECENT_PROJECTS;
    for (let i = 0; i < removeCount; i++) {
      await idbRequest(store.delete(sorted[i].id));
    }
  }
  await idbTransactionDone(tx);
}

export async function deleteProject(id: string): Promise<void> {
  const database = await db();
  const tx = database.transaction(STORE, "readwrite");
  await idbRequest(tx.objectStore(STORE).delete(id));
  await idbTransactionDone(tx);
}

export async function clearAllProjects(): Promise<void> {
  const database = await db();
  const tx = database.transaction(STORE, "readwrite");
  await idbRequest(tx.objectStore(STORE).clear());
  await idbTransactionDone(tx);
}

export function isIndexedDbAvailable() {
  return typeof indexedDB !== "undefined";
}
