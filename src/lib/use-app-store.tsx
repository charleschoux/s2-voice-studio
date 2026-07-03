"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  saveHistoryItem,
  listHistory,
  deleteHistoryItem,
  clearHistory,
  getAudioBlob,
  listPresets,
  savePreset,
  deletePreset,
  listFavorites,
  saveFavorite,
  deleteFavorite,
} from "./db";
import type { HistoryItem, Preset, Favorite } from "./types";
import { uid, nowISO } from "./utils";
import { PRESETS } from "./constants";

interface AppStore {
  ready: boolean;
  history: HistoryItem[];
  presets: Preset[];
  favorites: Favorite[];
  refresh: () => Promise<void>;
  addHistory: (item: Omit<HistoryItem, "id" | "createdAt">, audio?: Blob) => Promise<HistoryItem>;
  removeHistory: (id: string) => Promise<void>;
  wipeHistory: () => Promise<void>;
  getAudio: (id: string) => Promise<Blob | undefined>;
  addPreset: (p: Omit<Preset, "id" | "createdAt" | "builtin">) => Promise<Preset>;
  removePreset: (id: string) => Promise<void>;
  addFavorite: (f: Omit<Favorite, "addedAt">) => Promise<Favorite>;
  removeFavorite: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
}

const Ctx = React.createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [presets, setPresets] = React.useState<Preset[]>([]);
  const [favorites, setFavorites] = React.useState<Favorite[]>([]);

  const refresh = React.useCallback(async () => {
    try {
      const [h, p, f] = await Promise.all([
        listHistory(100).catch(() => [] as HistoryItem[]),
        listPresets().catch(() => [] as Preset[]),
        listFavorites().catch(() => [] as Favorite[]),
      ]);
      // Seed built-in presets on first run.
      if (p.length === 0) {
        const builtins: Preset[] = PRESETS.map((b) => ({
          id: `builtin-${b.id}`,
          name: b.name,
          description: b.description,
          params: b.params as Preset["params"],
          createdAt: nowISO(),
          builtin: true,
        }));
        for (const b of builtins) {
          await savePreset(b).catch(() => undefined);
        }
        setPresets(builtins);
      } else {
        setPresets(p);
      }
      setHistory(h);
      setFavorites(f);
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    refresh().finally(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, [refresh]);

  const addHistory = React.useCallback(
    async (item: Omit<HistoryItem, "id" | "createdAt">, audio?: Blob) => {
      const full: HistoryItem = {
        ...item,
        id: uid("h"),
        createdAt: nowISO(),
      };
      await saveHistoryItem(full, audio).catch(() => undefined);
      setHistory((prev) => [full, ...prev].slice(0, 100));
      return full;
    },
    [],
  );

  const removeHistory = React.useCallback(async (id: string) => {
    await deleteHistoryItem(id).catch(() => undefined);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const wipeHistory = React.useCallback(async () => {
    await clearHistory().catch(() => undefined);
    setHistory([]);
  }, []);

  const getAudio = React.useCallback(
    (id: string) => getAudioBlob(id).catch(() => undefined),
    [],
  );

  const addPreset = React.useCallback(
    async (p: Omit<Preset, "id" | "createdAt" | "builtin">) => {
      const full: Preset = {
        ...p,
        id: uid("p"),
        createdAt: nowISO(),
        builtin: false,
      };
      await savePreset(full);
      setPresets((prev) => [...prev, full]);
      return full;
    },
    [],
  );

  const removePreset = React.useCallback(async (id: string) => {
    await deletePreset(id).catch(() => undefined);
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addFavorite = React.useCallback(
    async (f: Omit<Favorite, "addedAt">) => {
      const full: Favorite = { ...f, addedAt: nowISO() };
      await saveFavorite(full);
      setFavorites((prev) => [full, ...prev.filter((x) => x.id !== f.id)]);
      toast.success(`已收藏 ${f.title || f.id}`);
      return full;
    },
    [],
  );

  const removeFavorite = React.useCallback(async (id: string) => {
    await deleteFavorite(id).catch(() => undefined);
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const isFavorite = React.useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites],
  );

  const value: AppStore = {
    ready,
    history,
    presets,
    favorites,
    refresh,
    addHistory,
    removeHistory,
    wipeHistory,
    getAudio,
    addPreset,
    removePreset,
    addFavorite,
    removeFavorite,
    isFavorite,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppStore(): AppStore {
  const ctx = React.useContext(Ctx);
  if (!ctx)
    throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}
