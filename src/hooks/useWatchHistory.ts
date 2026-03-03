import { useState, useCallback } from "react";

const STORAGE_KEY = "watchHistory";
const MAX_ITEMS = 20;

export interface WatchHistoryEntry {
  contentId: string;
  season?: string;
  episode?: string;
  provider?: string;
}

function readEntries(): WatchHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item: unknown): item is WatchHistoryEntry =>
        typeof item === "object" && item !== null && "contentId" in item,
    );
  } catch {
    return [];
  }
}

function writeEntries(entries: WatchHistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useWatchHistory() {
  const [entries, setEntries] = useState<WatchHistoryEntry[]>(readEntries);

  const addToHistory = useCallback(
    (contentId: string, opts?: { season?: string; episode?: string; provider?: string }) => {
      setEntries((prev) => {
        const existing = prev.find((e) => e.contentId === contentId);
        const entry: WatchHistoryEntry = {
          contentId,
          season: opts?.season ?? existing?.season,
          episode: opts?.episode ?? existing?.episode,
          provider: opts?.provider ?? existing?.provider,
        };
        const next = [entry, ...prev.filter((e) => e.contentId !== contentId)].slice(0, MAX_ITEMS);
        writeEntries(next);
        return next;
      });
    },
    [],
  );

  const getEntry = useCallback(
    (contentId: string): WatchHistoryEntry | null => {
      return entries.find((e) => e.contentId === contentId) ?? null;
    },
    [entries],
  );

  const ids = entries.map((e) => e.contentId);

  return { ids, entries, addToHistory, getEntry };
}
