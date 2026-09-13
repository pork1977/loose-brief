"use client";

/*
 * Stores the image files behind a brief's materials in IndexedDB.
 *
 * The brief itself lives in localStorage, which is small and strings only, so
 * the pictures go here, keyed by material id. Every function fails quietly:
 * if the browser blocks storage, the material keeps its colours and notes but
 * the thumbnail won't come back after a refresh.
 */

const DB_NAME = "loose-brief";
const STORE = "material-files";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }
  return dbPromise;
}

async function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  try {
    const db = await openDb();
    return await new Promise<T>((resolve, reject) => {
      const request = work(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

export async function saveMaterialFile(id: string, blob: Blob): Promise<boolean> {
  return (await run("readwrite", (store) => store.put(blob, id))) !== null;
}

export async function loadMaterialFile(id: string): Promise<Blob | null> {
  const result = await run<Blob | undefined>("readonly", (store) => store.get(id));
  return result instanceof Blob ? result : null;
}

export async function deleteMaterialFile(id: string): Promise<void> {
  await run("readwrite", (store) => store.delete(id));
}

/** Delete stored files no material refers to, e.g. after a save was cleared or couldn't be read. */
export async function pruneMaterialFiles(keepIds: string[]): Promise<void> {
  const keys = await run<IDBValidKey[]>("readonly", (store) => store.getAllKeys());
  if (!keys) return;
  const keep = new Set(keepIds);
  await Promise.all(keys.filter((key) => !keep.has(String(key))).map((key) => deleteMaterialFile(String(key))));
}

export async function clearMaterialFiles(): Promise<void> {
  await run("readwrite", (store) => store.clear());
}
