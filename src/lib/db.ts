"use client";

import { openDB, type IDBPDatabase } from "idb";
import type { HistoryItem, Preset, Favorite } from "./types";

const DB_NAME = "s2-voice-studio";
const DB_VERSION = 1;
const STORE_HISTORY = "history";
const STORE_AUDIO = "audio"; // audio blobs keyed by history id
const STORE_PRESETS = "presets";
const STORE_FAVORITES = "favorites";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_HISTORY)) {
          const s = db.createObjectStore(STORE_HISTORY, { keyPath: "id" });
          s.createIndex("createdAt", "createdAt");
        }
        if (!db.objectStoreNames.contains(STORE_AUDIO)) {
          db.createObjectStore(STORE_AUDIO);
        }
        if (!db.objectStoreNames.contains(STORE_PRESETS)) {
          db.createObjectStore(STORE_PRESETS, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_FAVORITES)) {
          db.createObjectStore(STORE_FAVORITES, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

// ---------------- History ----------------

export async function saveHistoryItem(item: HistoryItem, audio?: Blob) {
  const db = await getDB();
  const tx = db.transaction([STORE_HISTORY, STORE_AUDIO], "readwrite");
  await tx.objectStore(STORE_HISTORY).put(item);
  if (audio) {
    await tx.objectStore(STORE_AUDIO).put(audio, item.id);
  }
  await tx.done;
}

export async function getAudioBlob(id: string): Promise<Blob | undefined> {
  const db = await getDB();
  return (await db.get(STORE_AUDIO, id)) as Blob | undefined;
}

export async function listHistory(limit = 100): Promise<HistoryItem[]> {
  const db = await getDB();
  const all = (await db.getAllFromIndex(STORE_HISTORY, "createdAt")) as HistoryItem[];
  return all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, limit);
}

export async function deleteHistoryItem(id: string) {
  const db = await getDB();
  const tx = db.transaction([STORE_HISTORY, STORE_AUDIO], "readwrite");
  await tx.objectStore(STORE_HISTORY).delete(id);
  await tx.objectStore(STORE_AUDIO).delete(id);
  await tx.done;
}

export async function clearHistory() {
  const db = await getDB();
  const tx = db.transaction([STORE_HISTORY, STORE_AUDIO], "readwrite");
  await tx.objectStore(STORE_HISTORY).clear();
  await tx.objectStore(STORE_AUDIO).clear();
  await tx.done;
}

// ---------------- Presets ----------------

export async function listPresets(): Promise<Preset[]> {
  const db = await getDB();
  return (await db.getAll(STORE_PRESETS)) as Preset[];
}

export async function savePreset(p: Preset) {
  const db = await getDB();
  await db.put(STORE_PRESETS, p);
}

export async function deletePreset(id: string) {
  const db = await getDB();
  await db.delete(STORE_PRESETS, id);
}

// ---------------- Favorites ----------------

export async function listFavorites(): Promise<Favorite[]> {
  const db = await getDB();
  return (await db.getAll(STORE_FAVORITES)) as Favorite[];
}

export async function saveFavorite(f: Favorite) {
  const db = await getDB();
  await db.put(STORE_FAVORITES, f);
}

export async function deleteFavorite(id: string) {
  const db = await getDB();
  await db.delete(STORE_FAVORITES, id);
}
