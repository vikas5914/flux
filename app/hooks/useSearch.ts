'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { searchMulti } from '../lib/tmdb';
import { mapSearchResultToContent, type Content } from '../data/content';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const data = await searchMulti(trimmed);
        if (controller.signal.aborted) return;

        const mapped = data.results
          .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
          .slice(0, 10)
          .map(mapSearchResultToContent);

        setResults(mapped);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return { query, setQuery, results, isLoading };
}

// --- Watch History ---

interface WatchHistoryItem {
  contentId: string;
  progress: number;
  episodeId?: string;
  lastWatched: string;
  // Snapshot for rendering without API calls
  title: string;
  poster: string;
  year: number;
  type: 'movie' | 'series';
}

export interface ContinueWatchingItem {
  content: Content;
  progress: number;
  episodeId?: string;
}

export function useWatchHistory() {
  const [history, setHistory] = useState<WatchHistoryItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('watchHistory');
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
      localStorage.setItem('watchHistory', JSON.stringify(newHistory));
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
          synopsis: '',
          backdrop: '',
          cast: [],
        },
        progress: h.progress,
        episodeId: h.episodeId,
      }));
  }, [history]);

  return { history, updateProgress, getContinueWatching };
}
