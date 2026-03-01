"use client";

import { useState, useCallback } from "react";
import type { Content } from "../data/content";

interface WatchHistoryItem {
  contentId: string;
  progress: number;
  episodeId?: string;
  lastWatched: string;
  // Snapshot for rendering without API calls
  title: string;
  poster: string;
  year: number;
  type: "movie" | "series";
}

export interface ContinueWatchingItem {
  content: Content;
  progress: number;
  episodeId?: string;
}

export function useWatchHistory() {
  const [history, setHistory] = useState<WatchHistoryItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("watchHistory");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const updateProgress = useCallback((content: Content, progress: number, episodeId?: string) => {
    setHistory((prev) => {
      const newHistory = [
        {
          contentId: content.id,
          progress,
          episodeId,
          lastWatched: new Date().toISOString(),
          title: content.title,
          poster: content.poster,
          year: content.year,
          type: content.type,
        },
        ...prev.filter((h) => h.contentId !== content.id),
      ];
      localStorage.setItem("watchHistory", JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  const getContinueWatching = useCallback((): ContinueWatchingItem[] => {
    return history
      .filter((h) => h.progress < 100 && h.progress > 0)
      .slice(0, 6)
      .map((h) => ({
        content: {
          id: h.contentId,
          title: h.title,
          poster: h.poster,
          year: h.year,
          type: h.type,
          rating: 0,
          genres: [],
          synopsis: "",
          backdrop: "",
          cast: [],
        },
        progress: h.progress,
        episodeId: h.episodeId,
      }));
  }, [history]);

  return { history, updateProgress, getContinueWatching };
}
