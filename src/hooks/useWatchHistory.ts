import { useState, useCallback, useEffect, useRef } from "react";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WatchHistoryEntry {
  contentId: string;
  season?: string;
  episode?: string;
  provider?: string;
  watchedTime?: number; // seconds into the video
  duration?: number; // total duration in seconds
}

export type WatchHistoryUpdate = Omit<WatchHistoryEntry, "contentId">;

// ---------------------------------------------------------------------------
// localStorage helpers (fallback for unauthenticated users)
// ---------------------------------------------------------------------------

const STORAGE_KEY = "watchHistory";
const MIGRATED_KEY = "watchHistory_migrated";
const MAX_ITEMS = 20;

function readLocalEntries(): WatchHistoryEntry[] {
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

function writeLocalEntries(entries: WatchHistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function shouldResetProgress(existing?: WatchHistoryEntry, next?: WatchHistoryUpdate) {
  if (!existing || !next) return false;
  if (next.watchedTime !== undefined || next.duration !== undefined) return false;

  const nextSeason = next.season ?? existing.season;
  const nextEpisode = next.episode ?? existing.episode;

  return nextSeason !== existing.season || nextEpisode !== existing.episode;
}

function addLocalEntry(contentId: string, opts?: WatchHistoryUpdate) {
  const localEntries = readLocalEntries();
  const existing = localEntries.find((e) => e.contentId === contentId);
  const resetProgress = shouldResetProgress(existing, opts);
  const entry: WatchHistoryEntry = {
    contentId,
    season: opts?.season ?? existing?.season,
    episode: opts?.episode ?? existing?.episode,
    provider: opts?.provider ?? existing?.provider,
    watchedTime: opts?.watchedTime ?? (resetProgress ? 0 : existing?.watchedTime),
    duration: opts?.duration ?? (resetProgress ? 0 : existing?.duration),
  };
  const next = [entry, ...localEntries.filter((e) => e.contentId !== contentId)].slice(
    0,
    MAX_ITEMS,
  );
  writeLocalEntries(next);
}

// ---------------------------------------------------------------------------
// Public hook — uses Convex when authenticated, localStorage otherwise
// ---------------------------------------------------------------------------

export function useWatchHistory() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  // --- localStorage state (always maintained as fallback) ---
  const [localEntries, setLocalEntries] = useState<WatchHistoryEntry[]>(readLocalEntries);

  // --- Convex state (skip query when not authenticated) ---
  const serverEntries = useQuery(api.watchHistory.getUserHistory, isAuthenticated ? {} : "skip");
  const upsertMutation = useMutation(api.watchHistory.upsertWatchHistory);
  const importMutation = useMutation(api.watchHistory.importWatchHistory);
  const hasMigrated = useRef(false);

  // Migrate localStorage -> Convex on first auth (one-time)
  useEffect(() => {
    if (!isAuthenticated) return;
    if (hasMigrated.current) return;
    if (localStorage.getItem(MIGRATED_KEY)) {
      hasMigrated.current = true;
      return;
    }

    const local = readLocalEntries();
    hasMigrated.current = true;
    localStorage.setItem(MIGRATED_KEY, "true");

    if (local.length > 0) {
      void importMutation({ entries: local });
    }
  }, [isAuthenticated, importMutation]);

  // --- Derive entries from the right source ---
  const entries: WatchHistoryEntry[] =
    isAuthenticated && serverEntries
      ? serverEntries.map(
          (e: {
            contentId: string;
            season?: string;
            episode?: string;
            provider?: string;
            watchedTime?: number;
            duration?: number;
          }) => ({
            contentId: e.contentId,
            season: e.season,
            episode: e.episode,
            provider: e.provider,
            watchedTime: e.watchedTime,
            duration: e.duration,
          }),
        )
      : localEntries;

  // --- addToHistory ---
  const addToHistory = useCallback(
    (contentId: string, opts?: WatchHistoryUpdate) => {
      // Always write to localStorage (offline fallback)
      addLocalEntry(contentId, opts);
      setLocalEntries(readLocalEntries());

      // Also write to Convex when authenticated
      if (isAuthenticated) {
        void upsertMutation({
          contentId,
          season: opts?.season,
          episode: opts?.episode,
          provider: opts?.provider,
          watchedTime: opts?.watchedTime,
          duration: opts?.duration,
        });
      }
    },
    [isAuthenticated, upsertMutation],
  );

  // --- getEntry ---
  const getEntry = useCallback(
    (contentId: string): WatchHistoryEntry | null => {
      return entries.find((e) => e.contentId === contentId) ?? null;
    },
    [entries],
  );

  const ids = entries.map((e) => e.contentId);
  const isReady = !isLoading && (!isAuthenticated || serverEntries !== undefined);

  return { ids, entries, addToHistory, getEntry, isReady };
}
